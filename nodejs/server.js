var http = require("http");
var https = require("https");
var connect = require("connect");
var express = require("express");
var bodyParser = require("body-parser");
var serveStatic = require("serve-static");

var app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());


/////////////////////////////////////////////////
// ROUTES FOR API ///////////////////////////////
/////////////////////////////////////////////////

var port = process.env.port || 8888;
var router = express.Router();

router.get('/', function(req, res) {
    res.json({ message: 'working api' });
});
app.use('/api', router);
app.listen(port);

/////////////////////////////////////////////////
// AUTHENTICATION ///////////////////////////////
/////////////////////////////////////////////////

callAPI = function(method, path, headers) {
    
    oSec = '98c89f16608df03b0248b74ecaf6a79b',
    uSec = '846708bb4a1da71d70286bc5bb0c51bf',   
    ele = 'd2d3ec396a33f70d00f91a27e46bdb24'
    
    var options = {
        hostname: 'qa.cloud-elements.com',
        port: 443,
        path: '/elements/api-v2/hubs/documents/folders/contents?path=/',
        method: 'GET',
        headers: { 
            'Authorization': 'Element ' + ele + ', User ' + uSec + ', Organization ' +oSec    
        }
    };

    var req = https.request(options, function(res) {

        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
        });

    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e);
    });

    req.write('data\n');
    req.end();
    
}

/////////////////////////////////////////////////
// INIT /////////////////////////////////////////
/////////////////////////////////////////////////

callAPI();

/////////////////////////////////////////////////
// SERVER START// ///////////////////////////////
/////////////////////////////////////////////////

connect().use(serveStatic('www')).listen(8080);