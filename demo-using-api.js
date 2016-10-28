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
//   username: 'catlover',
//   password: '123'
// }, function(err, user) {
//   if (err) {
//     console.log(err);
//   }
//   else {
//     console.log(user);
//   }
//   connection.end();
// });

//var sortingMethod = ['top', 'hotness', 'newest', 'controversial']

// redditAPI.getAllPosts({numPerPage: 5, page: 0, sortingMethod: 'createAt'}, function(err, allPosts) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(allPosts);
//   }
//   connection.end();
// });

redditAPI.getPostForOneSubreddit({numPerPage: 25, page: 0, subName: 'animals'}, function(err, postsOfSub) {
  if(err) {
    console.log(err);
  } else {
    console.log(postsOfSub);
  }
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

// redditAPI.createSubreddit({name: 'food'}, function(err, theNewSubreddit) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(theNewSubreddit);
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
//       title: 'awesome sharks',
//       url: 'https://www.animals.com',
//       userId:  9,
// }
// redditAPI.createPost(testPost, 'animals', function (err, newPost) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(newPost);
//   }
//   connection.end();
// });


// redditAPI.createOrUpdateVote({
//   userId: 11,
//   postId: 3,
//   vote: 1
// }, function(err, result) {
//   if (err) {
//     console.log(err);
//   }
//   else {
//     console.log(result);
//   }
//   connection.end();
// })

// redditAPI.checkLogin('catlover', '123', function(err, res) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(res);
//   }
// })

// redditAPI.createSession(1, function(err, session) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(session);
//   }
// })

// redditAPI.getUserFromSession(1, function(err, user) {
//   if(err) {
//     console.log(err);
//   } else {
//     console.log(user);
//   }
// })