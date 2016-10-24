var express = require('express');

var myApp = express();

myApp.get('/hello', function(request, response) {
    console.log(request.query);
    response.send('<h1>Hello, ' + request.query.name + '!</h1>');
}) 


// myApp.use(function(request, response) {
//     console.log(request.method + '' + request.url); 
// })

var server = myApp.listen(process.env.PORT, process.env.IP, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log('myApp listening at http://%s:%s', host, port );
});