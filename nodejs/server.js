var http = require("http");
var https = require("https");
var connect = require("connect");
var express = require("express");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var serveStatic = require("serve-static");
var url = require("url");
var qs = require('querystring');

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

/////////////////////////////////////////////////
// CONFIG ///////////////////////////////////////
/////////////////////////////////////////////////

    
    //////////////////////////////////////////////////////////////////////////////////
    // EXAMPLE USE ONLY                                                             //
    //                                                                              //
    // Note: Typically, you would want to store your Org Secret and User Secret     //
    //       in a more secure manner than plain-text (e.g. Database). For example   //
    //       purposes, we are storing it in the server as a string to show how you  //
    //       would work with populated oSec and uSec variables.                     //
    //////////////////////////////////////////////////////////////////////////////////

    organizationSecret = '98c89f16608df03b0248b74ecaf6a79b',
    userSecret = '846708bb4a1da71d70286bc5bb0c51bf',
    documents = {
            'box': {
                'elementToken' : 'd2d3ec396a33f70d00f91a27e46bdb24'
            },

            'dropbox': {
                'elementToken' : 'd2d3ec396a33f70d00f91a27e46bdb24'
            },

            'googledrive': {
                'apiKey': '282923532784-mkr3pp81hpg3haqac31ki6fosbs66npk.apps.googleusercontent.com',
                'apiSecret': 'uBdvo1WM2jTu2H33utjDd5v0',
                'callbackUrl': 'http://localhost:63342/CloudFileBrowser/callback.html'
            },

//            'onedrive' : {
//
//            },
//
//            'sharepoint' : {
//
//            }
    }
    

/////////////////////////////////////////////////
// SERVER INIT //////////////////////////////////
/////////////////////////////////////////////////
app.use(allowCrossDomain);
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(connect.cookieParser());
app.use(connect.session({ secret: organizationSecret }));


/////////////////////////////////////////////////
// ROUTER FOR API ///////////////////////////////
/////////////////////////////////////////////////

var port = process.env.port || 8888;
var router = express.Router();

app.route
app.all('*', function(req, res) {

    if ( typeof String.prototype.startsWith != 'function' ) {
        String.prototype.startsWith = function( str ) {
            return this.substring( 0, str.length ) === str;
        }
    };

    var path = req.url;
    var parts = url.parse(req.url, true);
    var ele = parts.query['element'];

    //This request is for displaying the required providers on UI
    if(parts.pathname == '/elements/providers')
    {
        //Constructing the documents to be shown on UI
        var respdocuments = new Object;
        for(var x in documents)
        {
            respdocuments[x] = new Object;
            if(documents[x].elementToken != null)
            {
                respdocuments[x].present = true;
            }
        }
        res.json(respdocuments);
    }
    //This method is used for getting the file contents (folders or files)
    else if(parts.pathname == '/elements/contents')
    {
        var params = {
            'path' : parts.query['path']
        }

        callAPI('Get', '/elements/api-v2/hubs/documents/folders/contents', getHeaders(ele), params, function(data) {
            res.json(data);
        });
    }
    //This method is used for getting the download links for a file
    else if(parts.pathname == '/elements/getFile')
    {
        var params = {
            'path' : parts.query['path']
        }

        callAPI('Get', '/elements/api-v2/hubs/documents/folders/contents', getHeaders(ele), params, function(data) {
            res.json(data);
        });
    }
    else
    {
        callAPI('Get', req.url, req.headers, ele, function(data) {
            console.log('callback recieved', req.session);

            console.log(req);
            res.json(data);
        });
    }
});

app.listen(port);

/////////////////////////////////////////////////
// AUTHENTICATION ///////////////////////////////
/////////////////////////////////////////////////

getHeaders = function(element) {


    var authVal = '';

    if(element != null)
    {
        authVal +=  'Element ' + this.getElementToken(element)+ ', ';
    }

    authVal += 'User ' + userSecret + ', Organization ' +organizationSecret

    var header = {
        'Authorization' : authVal
    };
    console.log(header);
    return header;
},

getElementToken = function(element) {

    return documents[element].elementToken;
},

callAPI = function(method, path, headers, params, cb) {

    if(params != null)
    {
        path +='?'+qs.stringify(params);
    }

    var options = {
        hostname: 'qa.cloud-elements.com',
        port: 443,
        path: path,
        method: method,
        headers : headers
//        headers: {
//            'Authorization': 'Element d2d3ec396a33f70d00f91a27e46bdb24, User ' + userSecret + ', Organization ' +organizationSecret
//        }
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

//    if(params != null)
//    {
//        console.log(params);
//        console.log(qs.stringify(params));
//        req.write(qs.stringify(params));
//    }
    req.end();
    
}

/////////////////////////////////////////////////
// SERVER START /////////////////////////////////
/////////////////////////////////////////////////

connect().use(serveStatic('www')).listen(8080);