var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;

module.exports = function RedditAPI(conn) {
  //assign all of the functions as a variable 
  var api = {
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
      if (!subredditId) {
        callback(new Error('subredditId is required'));
        return;
      }
      conn.query(
        'INSERT INTO posts (userId, subredditId, title, url, createdAt) VALUES (?, ?, ?, ?, ?)', [post.userId, subredditId, post.title, post.url, new Date()],
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            /*
            Post inserted successfully. Let's use the result.insertId to retrieve
            the post and send it to the caller!
            */
            api.getSinglePost(result.insertId, callback);
          }
        }
      );
    },
    /*
    //becase getAllPosts function was reused for getSinglePost and getAllPostsForUser functions
    //here the options have to give us possiblity to pass postId or userId as parameter
    */
    getAllPosts: function(options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      //in the query below, 
      conn.query(`
        SELECT
          posts.id as posts_id,
          posts.title as posts_title,
          posts.url as posts_url,
          users.id as users_id,
          users.username as users_username,
          subreddits.id as subreddits_id,
          subreddits.name as subreddits_name,
          subreddits.description as subreddits_description
        FROM posts
        JOIN users ON posts.userId = users.id
        JOIN subreddits ON posts.subredditId = subreddits.id
        ${options.userId ? 'WHERE users.id = ?' : ''}
        ${options.postId ? 'WHERE posts.id = ?' : ''}
        ORDER BY posts.createdAt DESC
        LIMIT ? OFFSET ?`
        , options.userId ? [options.userId, limit, offset] : options.postId? [options.postId, limit, offset] : [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            results = results.map(function(result) {
              return {
                id: result.posts_id,
                title: result.posts_title,
                url: result.posts_url,
                user: {
                  id: result.users_id,
                  username: result.users_username
                },
                subreddit: {
                  id: result.subreddits_id,
                  name: result.subreddits_name,
                  description: result.subreddits_description
                }
              };
            });
            
            if (options.postId) {
              callback(null, results[0]);
            }
            else {
              callback(null, results);
            }
            
          }
        }
      );
    },
    //this function takes userId and options as parameters 
    getAllPostsForUser: function(userId, options, callback) {
      if (!callback) {
        callback = options;
        options = {};
      }
      //put userId inside of object options as a property
      options.userId = userId;
      //call getAllposts from the variable api AND pass options as parameter that has a key-value pair userId
      //should be also able to write api.getAllPosts({options: userId}, callback)??;
      api.getAllPosts(options, callback);
    },
    //also use getAllPosts but pass postId as a parameter inside of the option object
    getSinglePost: function(postId, callback) {
      api.getAllPosts({postId: postId}, callback);
    },
    createSubreddit: function(subreddit, callback) {
      
      if (!subreddit || !subreddit.name) {
        callback(new Error('name is mandatory'));
        return;
      }
      conn.query(
        'INSERT INTO subreddits (name, description) VALUES (?, ?)', [subreddit.name, subreddit.description || ''],
        function(err, result) {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              callback(new Error('A subreddit with this name already exists'));
            }
            else {
              callback(err);
            }
          }
          else {
            /*
            Subreddit inserted successfully. Let's use the result.insertId to retrieve
            the post and send it to the caller!
            */
            conn.query(
              'SELECT id, name, description FROM subreddits WHERE id = ?', [result.insertId],
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
    }
  };
  
  return api;
}
