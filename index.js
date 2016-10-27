//Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
//var morgan = require("morgan");

var myRedditC = express();

//use the pug template engine
myRedditC.set('view engine', 'pug');

//middleware that parse the POST requests from HTML form
myRedditC.use(bodyParser.urlencoded({extended: false}));

//middleware that serves static files
myRedditC.use('/files', express.static('static_files'));

//middleware that adds cookie property to a request
myRedditC.use(cookieParser());

//middleware that holds the login info of user
function checkLoginToken (request, response, next) {
        if (request.cookies.SESSION) {
          redditAPI.getUserFromSession(request.cookies.SESSION, function(err, user) {
            if (err) {
              console.log(err);
            }
            if (user) {
              request.loggedInUser = user;
            } 
            next();
          });
        }
        else {
          next();
        }
      }
      
myRedditC.use(checkLoginToken);

//require my reddit functions and mysql databases
var reddit = require("./reddit");
var mysql = require('mysql');

//create connect to mysql database
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'mattychance',
  password : '',
  database: 'reddit'
});

//import the redditAPI
var redditAPI = reddit(connection);

//create homepage 
//query string is defaulted at 'hotness'; or ?sort=newest, or top, or controversial
myRedditC.get('/', function(req, res) {
    var queryStr = req.query.sort || 'hotness';
    //console.log(req.query.sort);
    redditAPI.getAllPosts({numPerPage: 25, page: 0, sortingMethod: queryStr}, function(err, allPosts) {
        if (err) {
            res.status(500).send('Sorry, something went wrong. Please try later.');
        } else {
            //console.log(allPosts);
            res.render('allpost-list', {posts: allPosts});
        }
    });
});

//create signup page
myRedditC.get('/signup', function(req, res) {
    res.render('signup-form');
});
//get user sign up data
myRedditC.post('/newUserSignup', function(req, res) {
    console.log(req.body);
    redditAPI.createUser({username: req.body.username, password: req.body.password}, function(err, user) {
        if (err) {
            res.status(500).send('sorry, sth went wrong. try later');
        } else {
            res.status(300).redirect('/login');
        }
    });
});

//create login page
myRedditC.get('/login', function(req, res) {
    res.render('login-form');
});
myRedditC.post('/login', function(req, res) {
    console.log(req.body);
    
    redditAPI.checkLogin(req.body.username, req.body.password, function (err, user) {
        if (err) {
            res.status(401).send(err.message);
        } else {
            redditAPI.createSession(user.id, function(err, token) {
                if (err) {
                    res.status(500).send('Sorry, something went wrong. Please try again later.');
                } else {
                    res.cookie('SESSION', token);
                }
            });
            res.redirect('/login');
        }
    });
});

//create the create post page
myRedditC.get('/createpost', function(req, res) {
    if (!req.loggedInUser) {
        console.log(req.loggedInUser);
        res.send(new Error('Please log in to create a post.'));
    }
    else {
        console.log('or here?');
        res.render('createPost-form');
    }
});

myRedditC.post('/createpost', function(req, res) {
    redditAPI.createPost();
});

//create subreddit page
myRedditC.get('/r/:subreddit', function(req, res) {
    var subredditId = parseInt(req.params.subreddit);
    //console.log(subredditId);
    redditAPI.getPostForOneSubreddit({numPerPage: 25, page: 0, subId: subredditId}, function(err, posts) {
        if (err) {
            res.status(500).send('Sorry! There was an error. Please try later.');
        } else {
            // res.send(posts);
            res.render('sub-post-list', {posts: posts});
        }
    });
});

//listen
var port = process.env.PORT || 3000;
myRedditC.listen(port, function() {
   if (process.env.C9_HOSTNAME) {
       console.log('Web server is listening on http://' + process.env.C9_HOSTNAME);
   } else {
       console.log('Web server is listening on http://localhost;' + port);
   }
});






