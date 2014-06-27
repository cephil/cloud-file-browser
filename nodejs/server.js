var http = require("http");
var https = require("https");
var connect = require("connect");
var express = require("express");
var bodyParser = require("body-parser");
var serveStatic = require("serve-static");

var app = express();

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};
app.use(allowCrossDomain);
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());


/////////////////////////////////////////////////
// ROUTER FOR API ///////////////////////////////
/////////////////////////////////////////////////

var port = process.env.port || 8888;
var router = express.Router();

app.get('*', function(req, res) {
    callAPI('Get', req.url, req.headers, function(data) {
        console.log('callback recieved');
        res.json(data);
    });
});

app.listen(port);

/////////////////////////////////////////////////
// AUTHENTICATION ///////////////////////////////
/////////////////////////////////////////////////

callAPI = function(method, path, headers, cb) {
    
    oSec = '98c89f16608df03b0248b74ecaf6a79b',
    uSec = '846708bb4a1da71d70286bc5bb0c51bf',   
    ele = 'd2d3ec396a33f70d00f91a27e46bdb24'
    
    var options = {
        hostname: 'qa.cloud-elements.com',
        port: 443,
        path: path,
        method: 'GET',
        headers: { 
            'Authorization': 'Element ' + ele + ', User ' + uSec + ', Organization ' +oSec    
        }
    };

    var req = https.request(options, function(res) {

        res.setEncoding('utf8');
        res.on('data', function (data) {
            console.log('BODY: ' + data);
            cb(JSON.parse(data));
        });

    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e);
    });

    req.end();
    
}

/////////////////////////////////////////////////
// SERVER START /////////////////////////////////
/////////////////////////////////////////////////

connect().use(serveStatic('www')).listen(8080);