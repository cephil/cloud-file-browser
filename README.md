#Cloud File Browser

##Demo
Cloud File Browser Demo  <http://cloudfilebrowser.io>


##Description
Cloud File Browser is a javascript library to connect to Document Hub provider (e.g. Dropbox, Box, Google Drive) by creating Cloud Elements instances.

##Requirements
jQuery 2+ <http://code.jquery.com/jquery-2.1.0.min.js>

Setup and create of application for the document provider. Find the document for setting up application for the provider  <http://cloudfilebrowser.io/documentprovidersetup>

##Setup
You can use the Cloud File Browser by downloading the source and including in your application or you can use the hosted script

Include the (minified) JavaScript cfb.min.js script in your HTML markup or the webpage

```html
<script src="http://code.jquery.com/jquery-2.1.0.min.js"></script>
<script src="http://code.cloudfilebrowser.io/cfb.min.js"></script>
```
or alternatively, include the lib, img, fonts, css folders and callback.html in your web application

```html

<link rel="stylesheet" href="css/normalize.css" />
<link rel="stylesheet" href="css/font-awesome.min.css" />
<link rel="stylesheet" href="css/styles.css" />

<script src="http://code.jquery.com/jquery-2.1.0.min.js"></script>
<script src="lib/cloudfilebrowser.js"></script>
<script src="lib//provision.js"></script>
```

Add a section where you would like the Cloud File Browser to show up in your page

```html
<section class="cloudFileBrowser"></section>
```

##Usage
Initializing the Cloud File Browser is easy, pass in the documents json and options json to cloudFileBrowser({documents:documentsjson, options:optionsjson})

documents takes the configuration of each element,

 Option 1) If an element instance token is present, pass in the elementToken for the element
 Option 2) If an element instance template is present pass in the template instance token as elementTemplate
 Option 3) You can pass in the 'apiKey', 'apiSecret' and 'callbackUrl'

make sure callbackUrl to configure for the provider is http://code.cloudfilebrowser.io/callback.html or <Your Domain>/callback.html based on how your importing the Cloud File Browser js
    Supported documents providers are box, dropbox, googledrive, onedrive, sharepoint

options takes the required header credentials of the Cloud Elements user, it needs Organization Secret, User secret and Account key of the user. Pass oSec for Organization Secret, uSec for User secret and aKey for Account key
options takes another parameter callback, this is the callback function that's called when a file or files are selected or when an element instance is created. Callback function that's called sends type and data as arguments.

```html

    <script>

        $('.cloudFileBrowser').cloudFileBrowser({
            documents: {
                'box': {
                    'elementToken' : 'd2d3ec396a33f70d00f91a27e46bdb24'
                },

                'dropbox': {
                    'elementToken' : 'QutQPpIwc64HNzdvafBd6uFumBUxnPHzYsr/wC1LrXM='
                },

                'googledrive': {
                    'apiKey': '62873478234-nd8p5qnn6kubs8tasdaSD5flllcmo3jvn4a.apps.googleusercontent.com',
                    'apiSecret': 'eOUYQmasVHJw-P9Lsc780Felk',
                    'callbackUrl': 'http://code.cloudfilebrowser.io/callback.html'
                },

                'onedrive' : {
                    'elementToken' : 'Z2MYlVQ5abR4cdSsmh9LMFCh33WncZo80T+/upeWDlE='
                },

                'sharepoint' : {
                    'elementToken' : 'cnL7LHDaSR8oavlL4vPCSHNIlVhg+zFQeETRp+TmRJU='
                }
            },
            options: {
                callback: mycallback,
                oSec : '98c89f16608df03b0248b74ecaf6a79b',
                uSec : '846708bb4a1da71d70286bc5bb0c51bf',
                aKey : '846708bb4a1da7AkYcOUN'
            }
        });



        ////////////////////////////////////////////////
        //Caller Callback function for post operations//
        ////////////////////////////////////////////////

        function mycallback(type, data) {
            var res = '';
            for (property in data)
            {
                var val = data[property];
                if(typeof val == 'string')
                {
                    res += property + ':' + val+'<br>';
                }
                else
                {
                    res += property + ':' + JSON.stringify(val)+'<br>';
                }
            }

            console.log('Callback for type ' + type + ' with response ' + res);
        };


    </script>

```

##Options
  You can find the examples of using the Cloud File Browser under examples folder

###Example1
    filebrowser1.html shows you how to use Cloud File Browser by downloading the source and using it in your web application

###Example2
    filebrowser2.html shows you how to use Cloud File Browser in a modal window

###Example3
    filebrowser1.html shows you how to use Cloud File Browser by importing the required code from cloudfilebrowser.io




##License

```
All code licensed under the MIT License. All images licensed under Creative Commons Attribution 3.0 Unported License. In other words you are basically free to do whatever you want.

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
```
