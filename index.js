var express = require('express');

var myWebServer = express();

myWebServer.get('/hello', function(request, response) {
    console.log(request.query);
    response.send('<h1>Hello ! 你好啊! </h1>');
})

// myWebServer.use(function(request, response) {
//     console.log(request.method + '' + request.url); 
// })

myWebServer.listen(process.env.PORT);