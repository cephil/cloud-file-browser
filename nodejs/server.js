/*
###################################################################################
##     Cloud File Browser                                                        ##
###################################################################################

Copyright 2012-2014 Cloud Elements <http://www.cloud-elements.com>          

Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.

*/

/////////////////////////////////////////////////
// NODEJS SERVER EXAMPLE ////////////////////////
/////////////////////////////////////////////////
/*

    The Following is an example server on how to route
    REST calls from the Cloud File Browser to the Cloud
    Elements API while keeping your User Secret and
    Organization Secret hidden from the end user.
    
    For this example, we're using Node.js in combination
    with Express and Connect. The basics of what we're
    doing here is catching ANY request that comes into
    localhost:8888 and transforming the request into
    a valid Cloud Elements API request -- This way,
    we're able to keep the URL paths consistent across
    a number of different platforms.

*/

var http = require("http");
var https = require("https");
var connect = require("connect");
var express = require("express");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var serveStatic = require("serve-static");
var url = require("url");
var qs = require('querystring');
var Busboy = require('busboy');
var rest = require('restler');

var multiparty = require('multiparty');
var util = require('util');


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
                'apiKey': '282923532784-t89r45pvo4nuo49l6clpfa6b8mkkgnnu.apps.googleusercontent.com',
                'apiSecret': 'uErA1R7L4BAxZdgKW20VcqpE',
                'callbackUrl': 'http://localhost:8080/callback.html'
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
//app.use(bodyParser({ keepExtensions: true, uploadDir: "/elements/upload" }));  
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

    /////////////////////////////////////////////////
    //This request is for displaying the required providers on UI
    /////////////////////////////////////////////////
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
    /////////////////////////////////////////////////
    //This method is used for getting the file contents (folders or files)
    /////////////////////////////////////////////////
    else if(parts.pathname == '/elements/contents')
    {
        var params = {
            'path' : parts.query['path']
        }

        callAPI('Get', '/elements/api-v2/hubs/documents/folders/contents', getHeaders(ele), params, function(data) {
            res.json(data);
        });
    }
    /////////////////////////////////////////////////
    //This method is used for getting the download links for a file
    /////////////////////////////////////////////////
    else if(parts.pathname == '/elements/links')
    {
        var params = {
            'path' : parts.query['path']
        }

        callAPI('Get', '/elements/api-v2/hubs/documents/files/links', getHeaders(ele), params, function(data) {
            res.json(data);
        });
    }
    /////////////////////////////////////////////////
    // This method is for getting the OAuth URL for requesting the User access
    /////////////////////////////////////////////////
    else if(parts.pathname == '/elements/oauth')
    {
        var elementDetails = getElementDetails(ele);

        var params = {
            'elementKeyOrId': ele,
            'apiKey' : elementDetails.apiKey,
            'apiSecret': elementDetails.apiSecret,
            'callbackUrl': elementDetails.callbackUrl
        } 

        callAPI('Get', '/elements/api-v2/elements/'+ele+'/oauth', getHeaders(ele), params, function(data) {
            res.json(data);
        });
    }
    /////////////////////////////////////////////////
    // This method is for creating the element instance after the user has approved the access
    /////////////////////////////////////////////////
    else if(parts.pathname == '/elements/instances')
    {
        var elementDetails = getElementDetails(ele);

        var elementProvision = {
            'configs': [
                {
                    'key' : 'oauth.api.key',
                    propertyValue : elementDetails.apiKey
                },
                {
                    'key' : 'oauth.api.secret',
                    propertyValue : elementDetails.apiSecret
                },
                {
                    'key' : 'oauth.callback.url',
                    propertyValue : elementDetails.callbackUrl
                }
            ],
            'element': {
                "key" : ele
            },
            'name': ele
        };

        var postdata = JSON.stringify(elementProvision);

        var params = {
            'code': parts.query['code']
        }

        callAPI('POST', '/elements/api-v2/instances', getHeaders(ele, postdata), params, function(data) {

            setElementToken(ele, data.token);

            res.json(data);

        }, postdata);
    }
    /////////////////////////////////////////////////
    // This method is for Uploading a file
    /////////////////////////////////////////////////
    else if(parts.pathname == '/elements/upload')
    {
        console.log(req);
        //c0onsole.log(req.files);
        console.log(parts);
        
       // var form = new multiparty.Form();
        //var params = {};
        var headers = getHeaders(ele);
        var data = '';
        
        if(params != null)
        {
            path +='?'+qs.stringify(params);
        }
        
        req.on('data', function(chunk) {
            data += chunk;
        
            console.log(data);
        });
        
        
        var options = {
            hostname: 'qa.cloud-elements.com',
            port: 443,
            path: '/elements/api-v2/hubs/documents/files',
            method: 'POST',
            headers : headers,
            body: data
        };

        console.log(options);
        //console.log(req);

        var req = https.request(options, function(res) {

            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                //console.log('BODY: ' + data);
                data += chunk;
                //cb(JSON.parse(data));
                
                console.log('data recieved: ', data);
            });
        });

        req.on('error', function(e) {
            console.log('problem with request: ' + e);
        });

        //For POST requests
        /*if(jsondata != null)
        {
            req.write(jsondata);
        }*/

        req.end();
        
        
       /* req.on('data', function(chunk) {
            data += chunk;
        });
        
        //console.log(data);
        
        req.on('end', function()  {
            //util.log('raw: ' + data);
            
            var json = qs.parse(data);
            
            //util.log('json: ' + util.inspect(json));
            
            callAPI('POST', '/elements/api-v2/hubs/documents/files', getHeaders(ele), params, function(data) {
                console.log('Uploade File Response: ' + data);
            }, json);
            
            
        
            req.on('close', function() {
                console.log('req closed');
            });
        });*/
        
        
        return;
        
  /*      var params = {};
        
        var busboy = new Busboy({ headers: req.headers });
        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
            var datalength = 0;
            file.on('data', function(data) {
                datalength += data.length;
                console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
            });

            file.on('end', function() {
                console.log('File [' + fieldname + '] Finished');
                
                if (parts.query['path'] === '/') {
                    params = {
                        'path': '/'+filename
                    }
                }
                else {
                    params = {
                        'path': parts.query['path']+'/'+filename
                    }
                }

//                callAPI('POST', '/elements/api-v2/hubs/documents/files', getHeaders(ele), params, function(data) {
//
//                    res.json(data);
//
//                }, file);
                var headers = getHeaders(ele);
                headers['Content-Length']= datalength;

                console.log(headers);

//                var options = {
//                    host : 'qa.cloud-elements.com',
//                    port : 443,
//                    path : parts.query['path']+'/'+filename,
//                    method : 'PUT',
//                    encoding : 'utf8'
//                };
//
//                postData(null, [{type: mimetype, keyname: fieldname, valuename: filename, data: file}], options, headers, this);


//                rest.post('https://qa.cloud-elements.com/elements/api-v2/hubs/documents/files?path='+parts.query['path']+'/'+filename, {
//                    multipart: true,
//                    headers : header,
//                    contentType: false,
////                    data: {
////                        'file': file
////                    }
//                    data: [{type: mimetype, keyname: fieldname, valuename: filename, data: file}]
//                }).
//                on('complete', function(data) {
//                    console.log(data);
//                });
            });

            console.log('path params: ', params);

            
            file.pipe(fs.createWriteStream(params.path));
        });
//        busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
//            console.log('Field [' + fieldname + ']: value: ' + inspect(val));
//        });
//        busboy.on('finish', function() {
//            console.log('Done parsing form!');
//            res.writeHead(303, { Connection: 'close', Location: '/' });
//            res.end();
//        });
        req.pipe(busboy);
*/
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

getHeaders = function(element, postdata) {
    var authVal = '';

    if(element != null && this.getElementToken(element) != null)
    {
        authVal +=  'Element ' + this.getElementToken(element)+ ', ';
    }

    authVal += 'User ' + userSecret + ', Organization ' +organizationSecret

    var header = {
        'Authorization' : authVal,
        'Content-Type' : 'multipart/form-data'
    };

    ////////////////////////////////////////////////
    // Commented out as we are now sending Binary //
    ////////////////////////////////////////////////
    
    /*if(postdata != null)
    {
        for (var key in postdata.file[0].headers) {
            header[key] = postdata.file[0].headers[key];
        }
        
        header['content-length'] = postdata.file[0].size; 
    }*/
    
    return header;
},

getElementToken = function(element) {

    return documents[element].elementToken;
},

setElementToken = function(element, token) {

    documents[element].elementToken = token;
},

getElementDetails = function(element) {

    return documents[element];
},

callAPI = function(method, path, headers, params, cb, jsondata) {

    if(params != null)
    {
        path +='?'+qs.stringify(params);
    }
    
    jsondata = JSON.stringify(jsondata);

    var options = {
        hostname: 'qa.cloud-elements.com',
        port: 443,
        path: path,
        method: method,
        headers : headers,
        body: jsondata
    };

    console.log(options);

    var req = https.request(options, function(res) {

        res.setEncoding('utf8');
        res.on('data', function (data) {
            //console.log('BODY: ' + data);
            cb(JSON.parse(data));
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e);
    });

    //For POST requests
    if(jsondata != null)
    {
        req.write(jsondata);
    }

    req.end();
    
},
    
uploadComplete = function(err, res, body) {
    console.log(body);   
}

/////////////////////////////////////////////////
// SERVER START /////////////////////////////////
/////////////////////////////////////////////////

connect().use(serveStatic('www')).listen(8080);