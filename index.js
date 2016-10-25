var express = require('express');
var reddit = require('./reddit');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'mattychance', // CHANGE THIS :)
  password : '',
  database: 'reddit'
});
var redditAPI = reddit(connection);


var myApp = express();

myApp.get('/hello', function(request, response) {
    console.log(request.query);
    response.send('<h1>Hello, ' + request.query.name + '!</h1>');
}); 


myApp.get('/calculator/:op' ,function(request, response) {
    // console.log(request.query); 
    // console.log(request.params);
    var num1 = parseInt(request.query.num1);
    var num2 = parseInt(request.query.num2);
    var solution;
    switch (request.params.op) {
        case 'add':
            solution = num1 + num2;
            break;
        case 'sub':
            solution = num1 - num2;
            break;
        case 'mult':
            solution = num1 * num2;
            break;
        case 'div':
            solution = num1 / num2;
            break;
        default:
            response.status(403).send('Only the following operations are allowed: add, sub, mult, div!');

    }
    
    response.send({"operator": request.params.op, "firstOperand": request.query.num1, "secondOperand": request.query.num2, "solution": solution});
});


myApp.get('/posts', function(request, response) {

    redditAPI.getAllPosts({
        numPerPage: 5,
        page: 0,
        sortingMethod: 'createdAt'
    }, function(err, result) {
        if (err) {
            result.status(404).send('Something went wrong when retrieving the posts. Try again later.');
        }
        else {
            var html = [`<div id="contents">
                            <h1>Five Newest Posts</h1>
                                <ul class="contents-list">`];
            for (var i = 0; i < result.length; i++) {
        
                  html.push(`<li class="content-item">
                                  <h2 class="content-item__title">
                                    <a href=${result[i].postURL}>${result[i].title}</a>
                                  </h2>
                                  <p>Created by ${result[i].user.username}</p>
                                </li>`);
                 
            };
            
            html.push(` </ul>
                     </div>`);

            response.send(html.join(''));
        }
        connection.end();
    });
});

var formHTML = `<form action="/createContent" method="POST">
                    <div>
                      <input type="text" name="url" placeholder="Enter a URL to content">
                    </div>
                    <div>
                      <input type="text" name="title" placeholder="Enter the title of your content">
                    </div>
                    <button type="submit">Created!</button>
                </form>
                `;
                
myApp.get('/createContent', function(req, res) {
    res.send(formHTML);
});

var server = myApp.listen(process.env.PORT, process.env.IP, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log('myApp listening at http://%s:%s', host, port );
});


    
