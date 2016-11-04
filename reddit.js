var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;
var secureRandom = require('secure-random');

//functions that generate random tokens
function createSessionToken() {
  return secureRandom.randomArray(100).map(code => code.toString(36)).join('');
}

module.exports = function RedditAPI(conn) {
  return {
    createUser: function(user, callback) {

      // first we have to hash the password...
      bcrypt.hash(user.password, HASH_ROUNDS, function(err, hashedPassword) {
        if (err) {
          callback(err);
        }
        else {
          conn.query(
            'INSERT INTO users (username,password, createdAt) VALUES (?, ?, ?)', [user.username, hashedPassword, new Date()],
            function(err, result) {
              if (err) {
                /*
                There can be many reasons why a MySQL query could fail. While many of
                them are unknown, there's a particular error about unique usernames
                which we can be more explicit about!
                */
                if (err.code === 'ER_DUP_ENTRY') {
                  callback(new Error('A user with this username already exists'));
                }
                else {
                  callback(err);
                }
              }
              else {
                /*
                Here we are INSERTing data, so the only useful thing we get back
                is the ID of the newly inserted row. Let's use it to find the user
                and return it
                */
                conn.query(
                  'SELECT id, username, createdAt, updatedAt FROM users WHERE id = ?', [result.insertId],
                  function(err, result) {
                    if (err) {
                      callback(err);
                    }
                    else {
                      /*
                      Finally! Here's what we did so far:
                      1. Hash the user's password
                      2. Insert the user in the DB
                      3a. If the insert fails, report the error to the caller
                      3b. If the insert succeeds, re-fetch the user from the DB
                      4. If the re-fetch succeeds, return the object to the caller
                      */
                      callback(null, result[0]);
                    }
                  }
                );
              }
            }
          );
        }
      });
    },
    //createPost takes an object {title: , url: , userId: }, a subreddit Id and a callback function
    createPost: function(post, subredditName, callback) {
      //if subredditId is given, check whether it exists in the subreddits table or not
      if (!subredditName) {
        callback(new Error('Subreddit is required'));
        return;
      }

      //use getSinglepost function to do this
      conn.query('SELECT id FROM subreddits WHERE name = ?', [subredditName], function(err, subId) {
        if (err) {
          callback(err);
        }
        else {
          var getSubredditId = subId;
          var myquery = 'INSERT INTO posts (userId, title, url, createdAt, subredditId) VALUES (?, ?, ?, ?, ?)';
          conn.query(myquery, [post.userId, post.title, post.url, new Date(), getSubredditId[0].id],
            function(err, result) {
              if (err) {
                callback(err);
              }
              else {
                conn.query(
                  'SELECT userId, title, url, createdAt, subredditId FROM posts WHERE id = ?', [result.insertId],
                  function(err, result) {
                    if (err) {
                      callback(err);
                    }
                    else {
                      callback(null, result);
                    }
                  }
                );
              }
            }
          );
        }
      });
    },

    getAllPosts: function(options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;

      var sortingMethod = options.sortingMethod;
      if (options.sortingMethod === 'top') {
        sortingMethod = 'vote_score';
      }
      else if (options.sortingMethod === 'newest') {
        sortingMethod = 'posts.createdAt';
      }
      else if (options.sortingMethod === 'hotness') {
        sortingMethod = 'hotness';
      }
      else if (options.sortingMethod === 'controversial') {
        sortingMethod = `CASE WHEN SUM(votes.vote > 0) < SUM(votes.vote < 0) THEN COUNT(votes.vote) * (SUM(votes.vote > 0) DIV SUM(votes.vote < 0))
                                    WHEN SUM(votes.vote > 0) > SUM(votes.vote < 0) THEN COUNT(votes.vote) * (SUM(votes.vote < 0) DIV SUM(votes.vote > 0))
                               END
                             `;
      }
      else {
        sortingMethod = 'posts.id';
      }
      var myQuery = `SELECT posts.id as post_id
                            , posts.title as post_title
                            , posts.url as post_url
                            , users.id as user_id
                            , users.username as username
                            , subreddits.id as subreddit_id
                            , subreddits.name as subreddit_name
                            , subreddits.description as subreddit_description
                            , SUM(votes.vote) as vote_score
                            , (votes.vote / TIMESTAMPDIFF(MINUTE, posts.createdAt, NOW())) as hotness
                            , SUM(votes.vote > 0) as numUpVote
                            , SUM(votes.vote < 0) as numDownVote
                            , COUNT(votes.vote) as total_vote
                            from posts
                            LEFT JOIN users on users.id = posts.userId 
                            LEFT JOIN subreddits on subreddits.id = posts.subredditId
                            LEFT JOIN votes on votes.postId = posts.id
                            GROUP BY posts.id
                            ORDER BY ${sortingMethod} DESC
                            LIMIT ? OFFSET ?`;
      conn.query(
        myQuery, [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            //callback(null, results);
            var modifiedPosts = results.map(function(curr) {
              return {
                postId: curr.post_id,
                title: curr.post_title,
                postURL: curr.post_url,
                voteScore: curr.vote_score === 'null' ? curr.vote_score : 0,
                user: {
                  id: curr.user_id,
                  username: curr.username,
                },
                subreddit: {
                  id: curr.subreddit_id,
                  title: curr.subreddit_name,
                  description: curr.sub_description,
                }
              };
            });

            //console.log(modifiedPosts);
            callback(null, modifiedPosts);
          }
        }
      );
    },
    getAllPostsForUser: function(userId, options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      var query = 'SELECT * FROM posts JOIN users ON users.id = posts.userId WHERE posts.userId = ' + userId + `
            GROUP BY posts.createdAt DESC;`;
      conn.query(
        query, [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            callback(null, results);
          }
        }
      );
    },
    //next function starts here
    getSinglePost: function(postId, callback) {
      var query = `SELECT p.id as postId, p.title as postTitle, p.url, p.userId 
            FROM posts p JOIN users u 
            On u.id = p.userId WHERE p.id = ` + postId + ";";
      conn.query(
        query,
        function(err, singlePost) {
          if (err) {
            console.log(err);
          }
          else {
            callback(null, singlePost);
          }
        });
    },

    //next function here: add if to make sure there's a subreddit name being passed
    createSubreddit: function(sub, callback) {
      if (!sub || !sub.name) {
        callback(new Error('A subreddit name is required'));
        return;
      }
      conn.query(
        `INSERT INTO subreddits (name, description) VALUES (?, ?)`, [sub.name, sub.description || ''],
        function(err, newSubreddit) {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              callback(new Error('This subreddit name already exists.'));
            }
            else {
              callback(err);
            }
          }
          else {
            conn.query(`SELECT * FROM subreddits WHERE id = ?`, [newSubreddit.insertId], function(err, theNewSubreddit) {
              if (err) {
                callback(err);
              }
              else {
                // console.log(newSubreddit.insertId);
                // console.log(newSubreddit);
                callback(null, theNewSubreddit);
              }
            });
          }
        });
    },
    //next function here
    getAllSubreddits: function(callback) {
      conn.query(
        `SELECT subreddits.name from subreddits ORDER BY createdAt DESC`,
        function(err, listSubreddits) {
          if (err) {
            callback(err);
          }
          else {
            callback(null, listSubreddits);
          }
        });
    },
    //next function here
    //make sure one user cannot vote for one post more than one time
    createOrUpdateVote: function(vote, callback) {
      var voteValues = [-1, 0, 1];
      if (voteValues.indexOf(vote.vote) === -1) {
        callback(new Error("something went wrong when users try to vote"));
        return;
      }
      else {
        conn.query(
          `INSERT INTO votes 
                   (postId, userId, vote, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?) 
                   ON DUPLICATE KEY UPDATE vote = ?`, [vote.postId, vote.userId, vote.vote, new Date(), new Date(), vote.vote],
          function(err, theVote) {
            if (err) {
              callback(err);
            }
            else {
              conn.query(`SELECT SUM(vote) FROM votes WHERE postId = ?`, [vote.postId], function(err, voteScore) {
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, voteScore);
                }
              });
            }
          });
      }
    },
    //next function here
    getPostForOneSubreddit: function(options, callback) {
      if (!callback) {
        callback = options;
        options = {};
      }

      var limit = options.numPerPage || 25;
      var offset = (options.page || 0) * limit;
      if (!options.subName) {
        callback(new Error('Please select a subreddit category.'))
      }
      else {
        conn.query(`SELECT posts.title, posts.url, subreddits.name 
                          FROM posts 
                          LEFT JOIN subreddits 
                          ON subreddits.id = posts.subredditId
                          WHERE subreddits.name = ?`, [options.subName], function(err, postsOfSub) {
          if (err) {
            callback(err);
          }
          else {
            callback(null, postsOfSub);
          }
        });
      }
    },
    //next function here
    checkLogin: function(user, pw, callback) {
      conn.query(`SELECT * FROM users where username = ?`, [user], function(err, result) {
        if (err) {
          callback(err);
        }
        if (result.length === 0) {
          callback(new Error('User name or password is incorrect.'));
        }
        else {
          var user = result[0];
          if (!user) {
            callback(new Error('user or password incorrect'));
          }
          else {
            var actualHashedPassword = user.password;
            bcrypt.compare(pw, actualHashedPassword, function(err, res) {
              if (err) {
                callback(err);
              }
              if (res === true) {
                callback(null, user);
              }
              else {
                callback(new Error('Sorry your password is incorrent.'));
              }
            });
          }
        }
      });
    },
    //next function here 
    createSession: function(userId, callback) {
      var token = createSessionToken();

      conn.query(`INSERT INTO sessions SET userId = ?, token = ?, createdAt = ?`, [userId, token, new Date()], function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          callback(null, token);
        }
      });
    },
    //next function here
    getUserFromSession: function(token, callback) {
      conn.query(`SELECT users.id, users.username, sessions.token 
                  FROM sessions JOIN users 
                  ON sessions.userId=users.id 
                  WHERE sessions.token = ?`, [token], function(err, user) {
        if (err) {
          callback(err);
        }
        else {
          callback(null, user[0]);
        }
      });
    },
    //delete the session after a user logs out
    deleteSession: function(token, callback) {
      conn.query('DELETE FROM sessions WHERE token = ?', [token], function(err, session) {
        if (err) {
          callback (err);
        } else {
          callback(null, session[0]);
        }
      });
    }
    
  };
};