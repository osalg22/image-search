var dotenv = require('dotenv').config();
var express = require('express');
var mongo = require("mongodb").MongoClient;
var path = require('path');
var imagesearch = require("node-google-image-search");

var dburl = process.env.MONGO_URL;

var app = express();

app.set('port', process.env.PORT || 8080);

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/index.html'));   
});

app.get('/api/imagesearch/*', function (req, res) {
  var searchterm = req.params[0];
  var offset = req.query.offset;
  var date = new Date();
  //console.log(date.toString());
  if (!offset) { // if offset wasn't included, default to 1
      offset = 1;        
  }
  if (offset >= 10) {
      res.send({"error": "offset can only be between 1-9 as this search tool only returns 100 results."});
  } else {
      mongo.connect(dburl, function (err, db) {
          if (err) return console.log("DB connect ERROR");
          
          db.collection('searches').insert({
              "term": searchterm,
              "time": date.toString()
          }, function (err, result) {
              if (err) return console.log("Doc creation ERROR");
              
              imagesearch(searchterm, function (results) {
              
              // results[i].link : image url
              // results[i].image.contextLink : page url
              // results[i].image.thumbnailLink : thumbnail url
              // results[i].snippet : snippet
              var resArr = [];
              results.forEach(function (result) {
                  resArr.push({
                     "url": result.link,
                     "page": result.image.contextLink,
                     "thumbnail": result.image.thumbnailLink,
                     "snippet": result.snippet
                  }); 
              });
               
              res.send(resArr);
               
              }, offset, 10);
              db.close();
          });
      });
  }
});

app.get('/api/latest/imagesearch', function (req, res) {
    
    mongo.connect(dburl, function (err, db) {
        if (err) return console.log("DB connect ERROR");
        
        db.collection('searches').find({}, {
            term: 1,
            time: 1,
            _id: 0
        }).sort({_id:-1}).limit(10).toArray(function (err, docs) {
            if (err) return console.log("Document find error");
            
            res.send(docs);
        });
    });
});



app.listen(app.get('port'), function () {
    console.log("Listening on port " + app.get('port'));
});
