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

var CloudElements = (function() {

    var cedocumentconfig = null, oSec = null,
        uSec = null, aKey = null, envUrl=null,
        ceconfig =null, notif = null, callback=null,
        servicemapping = {
            'box' : 'Box',
            'dropbox': 'Dropbox',
            'googledrive': 'Google Drive',
            'onedrive': 'OneDrive',
            'sharepoint': 'SharePoint'
        };

    return {
        getConfig: function() {
            return cedocumentconfig;
        },

        getOTkn: function() {
            return oSec;
        },

        getUTkn: function() {
            return uSec;
        },

        getAkey: function() {
            return uSec;
        },

        getEnvUrl: function() {
            return envUrl;
        },

        setNotification: function(element, token, action) {

            if(callback != null || callback != undefined) {
                callback(action, {element:token});
            }

            if(notif == null || notif == undefined) {
                notif = new Object;
            }

            if(notif.action == null || notif.action == undefined) {
                notif[action] = new Object;
            }

            notif[action][element] = token;
        },

        getNotification: function() {
            return notif;
        },

        init: function(config) {

            cedocumentconfig = config.documents;
            oSec = config.oSec;
            uSec = config.uSec;
            aKey = config.aKey;
            callback = config.callback;
            ceconfig = config;

            if(config.env == null || config.env == undefined) {
                envUrl = 'https://console.cloud-elements.com/elements/'
            }
            else {
                envUrl = config.env;
            }

            var docservices = [],
                docservicesnames = [];
            for(var x in cedocumentconfig)
            {
                docservices.push(x);
                docservicesnames.push(servicemapping[x]);
            }

            cloudFileBrowser.init(docservices, docservicesnames);
        },

        updateCallback: function(pagequery) {

            provision.processNextOnCallback(pagequery);
        }
    };
})();

var provision = (function() {

     var lastCallbackArgs = null;
    _provision = {
        getTokenForElement: function(element) {
            var eleObj = CloudElements.getConfig()[element];
            return eleObj['elementToken'];
        },

        getElementDetails: function(element) {
            var eleObj = CloudElements.getConfig()[element];
            return eleObj;
        },

        setTokenToElement: function(element, token) {
            var eleObj = CloudElements.getConfig()[element];
            eleObj['elementToken'] = token;

            CloudElements.setNotification(element, token, 'create');
        },

        getParamsFromURI: function(queryparams) {
            var uri = decodeURI(queryparams);
            var chunks = uri.split('&');
            var params = Object();

            for (var i=0; i < chunks.length ; i++) {
                var chunk = chunks[i].split('=');
                if(chunk[0].search("\\[\\]") !== -1) {
                    if( typeof params[chunk[0]] === 'undefined' ) {
                        params[chunk[0]] = [chunk[1]];

                    } else {
                        params[chunk[0]].push(chunk[1]);
                    }


                } else {
                    params[chunk[0]] = chunk[1];
                }
            }

            return params;
        }
    };

    return {

        getDocuments: function(element, path, cb, cbArgs) {
            server.list(_provision.getTokenForElement(element), path, cb, cbArgs);
        },

        createInstance: function(element, cb, cbArgs) {

            //Step 1 : Check if the element token is present, if so list the documents
            var eleTkn = _provision.getTokenForElement(element);
            if(eleTkn != null) {
                cb(eleTkn, cbArgs);
                return;
            }

            //Step 2 : Check if API Key and Secret Exists, create an instance using those keys
            var elementDetails = _provision.getElementDetails(element);
            if(elementDetails != null && elementDetails != undefined) {

                var win = window.open('', '_target');

                var callbackArgs = {
                    'cbFun' : cb,
                    'cbArgs': cbArgs,
                    'element': element,
                    'win' : win,
                    'elementDetails': elementDetails
                }

                server.getOAuthUrlOnAPIKey(element, elementDetails.apiKey, elementDetails.apiSecret,
                    elementDetails.callbackUrl, provision.handleOnGetOAuthUrl, callbackArgs);

                return;
            }
        },

        handleOnGetOAuthUrl: function(data, cbArgs) {
            lastCallbackArgs = cbArgs;
            cbArgs.win.location.href = data.oauthUrl;
        },

        processNextOnCallback: function(queryparams) {

            var pageParameters = _provision.getParamsFromURI(queryparams);
            var not_approved= pageParameters.not_approved;

            if(not_approved) {
                // TODO Show that not approved
                return;
            }

            var ele = lastCallbackArgs.element;

            var cbArgs = {
                'element' : ele,
                'cbFun'   : lastCallbackArgs.cbFun,
                'cbArgs'  : lastCallbackArgs.cbArgs
            };

            //Provision the element and get elementToken
            var elementDetails = lastCallbackArgs.elementDetails;
            //Provision as new
            server.createInstance(ele, pageParameters.code, elementDetails.apiKey,
                elementDetails.apiSecret, elementDetails.callbackUrl, provision.handleOnCreateInstanceCall, cbArgs);
        },

        handleOnCreateInstanceCall: function(data, cbArgs) {

            _provision.setTokenToElement(cbArgs.element, data.token);

            //server.list(data.token, '/', cbArgs.cbFun, cbArgs.cbArgs);
            cbArgs.cbFun(data.token, cbArgs.cbArgs);
        },

        fileSelected: function(element, filepath) {
            CloudElements.setNotification(element, filepath, 'select');
        },

        getFile: function(tkn, path, cb, cbArgs) {
            server.getFile(_provision.getTokenForElement(element), filepath, cb, cbArgs);
        },

        downloadFile: function(element, filepath) {
            server.downloadFile(_provision.getTokenForElement(element), filepath);
        },
        
        displayFile: function(element, filepath, cb, cbArgs) {
            server.displayThumbnail(_provision.getTokenForElement(element), filepath, cb, cbArgs);
        },
        
        testThumbnail: function(url, cb) {
            server.testThumbnail(url, cb);
        },

        uploadFile: function(element, filepath, fileData, cb, cbArgs) {
            server.uploadFile(_provision.getTokenForElement(element), filepath, fileData, cb, cbArgs);
        }
    };

})();

var server = (function() {
    
    /**
     * Element Server private object
     * @type {Object}
     */
    _server = {

        //TODO Handle for IE CROS http://www.html5rocks.com/en/tutorials/cors/

        call: function(path, methodtype, headers, params, cb, cbArgs) {

            if(server.isNullAndUndef(methodtype))
                methodtype = 'Get';

            var proxy = $.ajax({
                url: server.getUrl(path),
                type: methodtype,
                headers: headers,
                data: params,
                cache: false,
                contentType: 'application/json'
            })
            .done(function(data) {
                console.log(data);
                if(server.isNullAndUndef(data.results))
                    cb(data, cbArgs);
                else
                    cb(data.results, cbArgs);

            })
            .error(function(data){
                console.log(data.status + ' error on ' + path);
                _server.handleFailure(data, cb, cbArgs);
            });
        },

        callUpload: function(path, methodtype, headers, params, cb, cbArgs) {

            var proxy = $.ajax({
                url: server.getUrl(path),
                type: methodtype,
                headers: headers,
                data: params,
                cache: false,
                processData: false,
                contentType: false
                //contentType: 'multipart/form-data; boundary=----WebKitFormBoundarymSI41Af84OjbuPgt'
            })
                .done(function(data) {
                    console.log(data);
                    if(server.isNullAndUndef(data.results))
                        cb(data, cbArgs);
                    else
                        cb(data.results, cbArgs);

                })
                .error(function(data){
                    console.log(data.status + ' error on ' + path);
                    _server.handleFailure(data, cb, cbArgs);
                });
        },
        
        callThumbnail: function(url, cb) {
        
                var proxy = $.ajax({
                    url: url,
                    type: 'Get',
                    cache: false
                })
                .done(function(data) {
                    console.log(data);
                    cb('true');
                })
                .error(function(data) {
                    
                    // Temporary catch for X-DOMAIN
                    if (data.status === 0) {
                        cb('true');
                    }
                    else {    
                        cb('false');
                        cloudFileBrowser.displayError('Error loading thumbnail!');
                    }
                });
        
        },

        handleFailure: function(response, cb, cbArgs)
        {   
            if (response.status == -1)
            {
                // This is a timeout, we can't expect an HTTP error code in the status field
                console.error('The server has not responded and ' +
                    'your request has timed out.' +
                    ' Please use your browser\'s refresh ' +
                    'button to try again. (' + response.statusText + ')');
                
                cloudFileBrowser.displayError(response.statusText);
            }
            else if (response.status == 0)
            {
                // This is a network error of some kind (connection lost for example) and
                // we can't expect an HTTP error code in the status field
                console.error('A communication error has occurred and ' +
                    'your request cannot be processed.' +
                    ' Please use your browser\'s refresh button ' +
                    'to try again. (' + response.statusText + ')');
                
                cloudFileBrowser.displayError(response.statusText);
            }
            else
            {
                if(server.isNullAndUndef(response.responseText))    
                {
                    cb(response, cbArgs);
                    
                    cloudFileBrowser.displayError(response.statusText);
                }
                else
                {
                    console.error('The server was unable to process this request. ' +
                        'Please contact your representative. (' +
                        response.status + '/' + response.statusText + ')');
                    
                    cloudFileBrowser.displayError(response.statusText);
                }
            }
        }

    };

    return {

        getUrl: function(additionalParams) {
            return CloudElements.getEnvUrl() + additionalParams;
        },

        isNullAndUndef: function(variable) {
            return (variable == null || variable == undefined);
        },

        authHeader: function(uSec, oSec, eleTkn) {

            var aHeader='';

            if(!this.isNullAndUndef(uSec)) {
                aHeader += 'User '+uSec;
            }

            if(!this.isNullAndUndef(oSec)) {
                aHeader += ', Organization '+oSec;
            }

            if(!this.isNullAndUndef(eleTkn)) {

                if(aHeader.length > 0) {
                    aHeader += ', Element '+eleTkn;
                }
                else {
                    aHeader += 'Element '+eleTkn;
                }
            }

            return {
                "Authorization" : aHeader
            };
        },

        list: function(tkn, path, cb, cbArgs) {

            var params = {
                'path' : path
            }

            _server.call('api-v2/hubs/documents/folders/contents', 'Get',
                this.authHeader(CloudElements.getUTkn(), CloudElements.getOTkn(), tkn), params, cb, cbArgs);
        },

        _downloadCallback: function(data) {
//            var win = window.open();
//            win.location=data.value;

            var hiddenIFrameID = 'hiddenDownloader',
                iframe = document.getElementById(hiddenIFrameID);
            if (iframe === null) {
                iframe = document.createElement('iframe');
                iframe.id = hiddenIFrameID;
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
            }
            iframe.src = data.cloudElementsLink;
        },

        getFile: function(tkn, path, cb, cbArgs) {

            var params = {
                'path' : path
            }

            _server.call('api-v2/hubs/documents/files', 'Get',
                this.authHeader(CloudElements.getUTkn(), CloudElements.getOTkn(), tkn), params, cb, cbArgs);
        },

        downloadFile: function(tkn, path, cb, cbArgs) {

            var params = {
                'path' : path
            }

            _server.call('api-v2/hubs/documents/files/links', 'Get',
                this.authHeader(CloudElements.getUTkn(), CloudElements.getOTkn(), tkn), params, this._downloadCallback, cbArgs);
        },
        
        displayThumbnail: function(tkn, path, cb, cbArgs) {
            
            var params = {
                'path' : path
            }
            
            _server.call('api-v2/hubs/documents/files/links', 'Get',
                this.authHeader(CloudElements.getUTkn(), CloudElements.getOTkn(), tkn), params, cb, cbArgs);
        },
        
        testThumbnail: function(url, cb) {
            _server.callThumbnail(url, cb);
        },

        uploadFile: function(tkn, path, file, cb, cbArgs) {

            var params = new FormData();
            params.append('file', file);

            var callbackArgs = {
                'cb': cb,
                'cbArgs': cbArgs
            };

            _server.callUpload('api-v2/hubs/documents/files?path='+path+'/'+file.name, 'POST',
                this.authHeader(CloudElements.getUTkn(), CloudElements.getOTkn(), tkn), params, this._uploadCallback, callbackArgs);
        },

        _uploadCallback: function(data, callbackArgs) {
            console.log(data);

            callbackArgs.cbArgs.data = data;
            callbackArgs.cb(callbackArgs.cbArgs);
        },

        getOAuthUrlOnAPIKey: function(element, apiKey, apiSec, callbackUrl, cb, cbArgs) {

            var parameters = {
                'elementKeyOrId': element,
                'apiKey' : apiKey,
                'apiSecret': apiSec,
                'callbackUrl': callbackUrl
            };



            _server.call('api-v2/elements/'+element+'/oauth', 'Get',
                this.authHeader(CloudElements.getUTkn(), CloudElements.getOTkn(), null), parameters, cb, cbArgs);
        },

        createInstance: function(element, code, apiKey, apiSec, callbackUrl, cb, cbArgs) {

            var elementProvision = {
                'configs': [
                    {
                        'key' : 'oauth.api.key',
                         propertyValue : apiKey
                    },
                    {
                        'key' : 'oauth.api.secret',
                         propertyValue : apiSec
                    },
                    {
                        'key' : 'oauth.callback.url',
                        propertyValue : callbackUrl
                    }
                ],
                'element': {
                    "key" : element
                },
                'name': element
            };

            _server.call('api-v2/instances?code='+code, 'POST',
                this.authHeader(CloudElements.getUTkn(), CloudElements.getOTkn(), null), JSON.stringify(elementProvision), cb, cbArgs);
        }

    }
})();