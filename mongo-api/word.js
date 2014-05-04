var mongo = require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {
    auto_reconnect: true
});
db = new Db('vocabulary-collector', server);

db.open(function(err, db) {
    if (!err) {
        console.log("Connected to 'vocabulary-collector' database");
        db.collection('word', {
            strict: true
        }, function(err, collection) {
            if (err) {
                console.log("The 'vocabulary-collector' collection doesn't exist. Creating it with sample data...");
                populateDB();
            }
        });
    }
});

exports.findByWord = function(req, res) {
    var word = req.params.word;
    console.log('Retrieving word: ' + word);
    db.collection('word', function(err, collection) {
        collection.findOne({
            'word': word
        }, function(err, item) {
            res.send(item);
        });
    });
};

exports.findAll = function(req, res) {
    db.collection('word', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};

exports.postWord = function(req, res) {
    var word = req.params.word;
    var wordItem = req.body;
    console.log('Posting word: ' + word);
    console.log(JSON.stringify(wordItem));

    db.collection('word', function(err, collection) {
        collection.findOne({
            'word': word
        }, function(err, item) {
            if (!item) {
                var insertItem = {
                    word: word,
                    count: 1,
                    sentences: wordItem.sentences
                };
                collection.insert(insertItem, {
                    safe: true
                }, function(err, result) {
                    if (err) {
                        res.send({
                            'error': 'An error has occurred'
                        });
                    } else {
                        console.log('Success: ' + JSON.stringify(result));
                        res.send('');
                    }
                });
            } else {
                item.count = item.count + 1;
                item.sentences = item.sentences.concat(wordItem.sentences);
                collection.update({
                    'word': item.word
                }, item, {
                    safe: true
                }, function(err, result) {
                    if (err) {
                        console.log('Error updating word: ' + err);
                        res.send({
                            'error': 'An error has occurred'
                        });
                    } else {
                        console.log('' + result + ' document(s) updated');
                        res.send('');
                    }
                });
            }
        });
    });
}

exports.deleteWord = function(req, res) {
    var word = req.params.word;
    console.log('Deleting word: ' + word);
    db.collection('word', function(err, collection) {
        collection.remove({
            'word': 'word'
        }, {
            safe: true
        }, function(err, result) {
            if (err) {
                res.send({
                    'error': 'An error has occurred - ' + err
                });
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}

exports.postWordBatch = function(req, res) {

};

/*--------------------------------------------------------------------------------------------------------------------*/
// Populate database with sample data -- Only used once: the first time the application is started.
// You'd typically not find this code in a real-life app, since the database would already exist.
var populateDB = function() {

    var words = [{
        word: "resurgenceA",
        count: 4,
        sentences: ["A resurgenceA of interest in boutique vineyards...", "A resurgenceA of interest in boutique vineyards of B..."]
    }, {
        word: "resurgence",
        count: 2,
        sentences: ["A resurgence of interest in boutique vineyards...", "A resurgence of interest in boutique vineyards of B..."]
    }];

    db.collection('word', function(err, collection) {
        collection.insert(words, {
            safe: true
        }, function(err, result) {});
    });

};