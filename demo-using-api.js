// load the mysql library
var mysql = require('mysql');

// create a connection to our Cloud9 server
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'mattychance', // CHANGE THIS :)
  password : '',
  database: 'reddit'
});

// load our API and pass it the connection
var reddit = require('./reddit');
var redditAPI = reddit(connection);

// It's request time!
// redditAPI.createUser({
//   username: 'test2',
//   password: '78912'
// }, function(err, user) {
//   if (err) {
//     console.log(err);
//   }
//   else {
//     redditAPI.createPost({
//       title: 'test2',
//       url: 'https://www.test2.com',
//       userId: user.id,
//     }, function(err, post) {
//       if (err) {
//         console.log(err);
//       }
//       else {
//         console.log(post);
//       }
//     });
//   }
// });

redditAPI.getAllPosts('options', function(err, allPosts) {
  if (err) {
    console.log(err);
  } else {
    console.log(allPosts);
  }
  connection.end();
});

// redditAPI.getAllPostsForUser(4, function(err, userPosts) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(userPosts);
//   }
//   connection.end();
// })

// redditAPI.getSinglePost(1, function (err, singlePost) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(singlePost[0]); 
//   }
//   connection.end();
// });

// redditAPI.createSubreddit(someNewObject, function(err, subreddit) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(subreddit);
//   }
//   connection.end();
// })

// redditAPI.getAllSubreddits(function (err, list) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(list);
//   }
//   connection.end();
// })
// var testPost = {
//       title: 'test3',
//       url: 'https://www.test3.com',
//       userId:  1,
// }
// redditAPI.createPost(testPost, 2, function (err, newPost) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(newPost);
//   }
//   connection.end();
// });
