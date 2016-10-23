var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;

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
    createPost: function(post, subredditId, callback) {
      //if subredditId is given, check whether it exists in the subreddits table or not
      if (!subredditId) {
        callback(new Error('Subreddit is required'));
        return;
      }
      
      //use getSinglepost function to do this
      var myquery = 'INSERT INTO posts (userId, title, url, createdAt, subredditId) VALUES (?, ?, ?, ?, ?)';
      conn.query(myquery, [post.userId, post.title, post.url, new Date(), subredditId],
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            /*
            Post inserted successfully. Let's use the result.insertId to retrieve
            the post and send it to the caller!
            */
            conn.query(
              'SELECT userId, title, url, createdAt, subredditId FROM posts WHERE id = ?', [result.insertId],
              function(err, result) {
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, result[0]);
                }
              }
            );
          }
        }
      );
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
      } else if (options.sortingMethod === 'newest') {
        sortingMethod = 'posts.createdAt';
      } else if (options.sortingMethod === 'hotness') {
        sortingMethod = 'hotness';
      } else {
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
                voteScore: curr.vote_score,
                user: {
                  id: curr.user_id,
                  username: curr.username,
                },
                subreddit: {
                  id: curr.subreddit_id,
                  title: curr.sub_name,
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
        callback(new Error ('A subreddit name is required'));
        return;
      }
      conn.query(
        `INSERT INTO subreddits (name, description) VALUES (?, ?)`, [sub.name, sub.description || ''],
        function(err, newSubreddit) {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              callback(new Error('This subreddit name already exists.'));
            } else {
              callback(err); } 
          }
          else {
            conn.query(`SELECT * FROM subreddits WHERE id = ?`, [newSubreddit.insertId], function(err, theNewSubreddit) {
              if (err) {
                callback(err);
              }
              else {
                callback(theNewSubreddit);
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
              callback(listSubreddits);
            }
          });
      },
      //next function here
      //there can be a lot of potential errors of this function
      //because the table has foreign keys that contrain the input
      //1. userId cannot be new -
      createOrUpdateVote: function(vote, callback) {
        var voteValues = [-1, 0, 1];
        if (voteValues.indexOf(vote.vote) === -1) {
          //console.log('shit');
          callback(new Error ("something went wrong when users try to vote"));
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
                conn.query( `SELECT SUM(vote) FROM votes WHERE postId = ?`, [vote.postId], function(err, voteScore) {
                  if (err) {
                    callback(err);
                  } else {
                    callback(voteScore);
                  }
                });
              }
            });
        }
      }
      //next function here
      
  }
}
