//Dependencies
var express = require("express");
var bodyParser = require("body-parser");
//var cookieParser = require('cookie-parser');
//var morgan = require("morgan");

var myRedditC = express();

//use the pug template engine
myRedditC.set('view engine', 'pug');

//middleware that parse the POST requests from HTML form
myRedditC.use(bodyParser.urlencoded({extended: false}));

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
    console.log(req.query.sort);
    redditAPI.getAllPosts({numPerPage: 25, page: 0, sortingMethod: queryStr}, function(err, allPosts) {
        if (err) {
            res.status(500).send('Sorry, something went wrong. Please try later.');
        } else {
            //console.log(allPosts);
            res.render('post-list', {posts: allPosts});
        }
    });
});

//create signup page
myRedditC.get('/signup', function(req, res) {
    res.render('signup-form');
});

//create login page
myRedditC.get('/login', function(req, res) {
    res.render('login-form');
});

//create the create post page
myRedditC.get('/createpost', function(req, res) {
   res.render('createPost-form'); 
});

//create subreddit page
myRedditC.get('/r/:subreddit', function(req, res) {
    
})

//listen
var port = process.env.PORT || 3000;
myRedditC.listen(port, function() {
   if (process.env.C9_HOSTNAME) {
       console.log('Web server is listening on http://' + process.env.C9_HOSTNAME);
   } else {
       console.log('Web server is listening on http://localhost;' + port);
   }
});

