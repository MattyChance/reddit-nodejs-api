var express = require('express');

var myApp = express();

myApp.get('/hello', function(request, response) {
    console.log(request.query);
    response.send('<h1>Hello, ' + request.query.name + '!</h1>');
}) 


myApp.get('/calculator/:op' ,function(request, response) {
    console.log(request.query); 
    console.log(request.params);
    var num1 = parseInt(request.query.num1);
    var num2 = parseInt(request.query.num2);
    var solution;
    switch (request.params.op) {
        case 'add':
            // code
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
})

var server = myApp.listen(process.env.PORT, process.env.IP, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log('myApp listening at http://%s:%s', host, port );
});