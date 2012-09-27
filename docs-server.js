var express = require('express');
var app = express();
//
//app.get('/', function(req, res){
//    res.send('Hello World');
//});
app.use('/api', express.static(__dirname + '/docs/api'));


app.listen(8090);
console.log('Listening on port 8090');

