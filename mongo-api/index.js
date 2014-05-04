var express = require('express'),
    word = require('./word');

var app = express();

app.configure(function() {
    app.use(express.logger('dev')); /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
});

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.options("*", function(req, res, next) {
    res.send(200);
});

app.get('/word', word.findAll);
app.post('/batch/word', word.postWordBatch);
app.get('/word/:word', word.findByWord);
app.post('/word/:word', word.postWord);
app.delete('/word/:word', word.deleteWord);

app.listen(3000);
console.log('Listening on port 3000...');