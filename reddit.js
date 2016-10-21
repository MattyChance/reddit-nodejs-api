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
    getAllPosts: function(userId, options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      var query = `SELECT 
                      p.id as postId, 
                      p.title as postTitle, 
                      p.url as postURL, 
                      p.createdAt as postCreatedDate, 
                      p.updatedAt as postUpdatedAt, 
                      u.id as userId, 
                      u.username, 
                      u.createdAt as userCreatedAt, 
                      u.updatedAt as userUpdatedAt, 
                      s.id as subId, 
                      s.name as subName, 
                      s.description as subDes, 
                      s.createdAt as subCreatedAt, 
                      s.updatedAt as subUpdatedAt
                  FROM posts p 
                  LEFT JOIN users u 
                      ON p.userId = u.id 
                  LEFT JOIN subreddits s 
                      ON p.subredditId = s.id
                   LIMIT ? OFFSET ?`;
      conn.query(
        query, [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            //callback(null, results);
            var modifiedPosts = results.map(function(curr) {
              return {
                postId: curr.postId,
                title: curr.postTitle,
                postURL: curr.postURL,
                user: {
                  id: curr.userId,
                  username: curr.username,
                  createdAt: curr.userCreatedAt,
                  updatedAt: curr.userUpdatedAt
                },
                subreddit: {
                  id: curr.subId,
                  title: curr.subName,
                  description: curr.subDes,
                  createdAt: curr.subCreatedAt,
                  updatedAt: curr.subUpdatedAt
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

    //next function here
    createSubreddit: function(sub, callback) {
      conn.query(
        `INSERT INTO subreddits (id, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`, [sub.id, sub.name, sub.description, new Date(), new Date()],
        function(err, newSubreddit) {
          if (err) {
            callback(err);
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
          })
      }
      //next function here
  }
}
