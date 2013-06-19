/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @extension Module Loader
 */
define.extend('raptor/loader', function(require) {
    "use strict";
    
    var logger = require('raptor/logging').logger('raptor/loader'),
        raptor = require('raptor'),
        forEach = raptor.forEach,
        extend = raptor.extend;
    
    var handle_require = function(requireId, transaction) {
        
        //See if the require already exists

        if (require.exists(requireId)) {
            return; //Module already available... nothing to do
        }
        
        //If the require has already been included as part of this transaction then nothing to do
        if (transaction.isIncluded(requireId)) {
            return;
        }
        
        //Mark the require as being part of this transaction
        transaction.setIncluded(requireId);
        
        var missing = function() {
            throw new Error('Dependencies missing: "' + requireId + '"');
        };
        
        //The metadata for the requires should have been serialized to a global variable
        //This information is required so that we know what the dependencies are for the require
        /*
        var asyncModulesMetadata = raptor.global.$rloaderMeta;
        
        if (!asyncModulesMetadata) {
            //Can't load the require if there is no metadata for any of the requires
            missing();
        }
        */
        
        //Now load the metadata for the requested requireId
        var metadata =  $rget('loaderMeta', requireId);
        
        if (!metadata) {
            //No metadata data found for this require... Throw an error
            missing();
        } else {     
            //Include all of the requires that this require depends on (if any)
            transaction.add('requires', metadata.requires);
            
            //Include all of the CSS resources that are required by this require (if any)
            transaction.add('js', metadata.js);
            
            //And include all of the JS resources that are required by this require (if any)
            transaction.add('css', metadata.css);
        }
    };
    
    return {
        handle_require: handle_require,
        handle_requires: handle_require,

        /**
         * Includes the specified requires asynchronously and invokes the callback methods in the provided callback for the supported events.
         * 
         * <p>The loaded requires will be passed to the success callback in the order that the requires are specified. 
         * 
         * @param requires {String|Array<String>} A require name or an array of require names
         * @param callback {Function|Object} Either a success/error callback function or an object with event callbacks. Supported events: asyncStart, success, error, asyncComplete, complete
         * @param thisObj The "this" object to use for the callback functions
         * 
         * @returns {raptor/loader/Transaction} The transaction for the asynchronous loading of the require(s)
         */
        load: function(requires, callback, thisObj) {
            var userSuccessFunc, //A reference to the user's success callback (if provided)
                wrappedCallback,
                isFunctionCallback = typeof callback === 'function';
            
            if ((userSuccessFunc = (isFunctionCallback ? callback : callback.success))) {
                //We want to pass the loaded requires as arguments to the success callback and that
                //is something the "loader" require will not do for us since it deals with objects
                //of mixed types (including CSS resources, JS resources and requires). To solve
                //that problem we are going to wrap the user success callback with our own
                //and have it be a proxy to the user's success callback
                
                //Copy all of the callback properties to a new object
                wrappedCallback = typeof callback !== "function" ? extend({}, callback) : {};
                
                //Now replace the success callback with our own. NOTE: We have already saved a reference to the user's success callback
                wrappedCallback.success = function() {
                    //Everything has finished loading so now let's go back through the require names and get the references
                    //to the loaded requires and added to the loadedModules array which will be passed to the success callback
                    var loadedModules = [];
                    try
                    {
                        forEach(requires, function(requireId) {
                            loadedModules.push(require.exists(requireId) ? require(requireId) : null); //Loading the require for the first time might trigger an error if there is a problem inside one of the factory functions for the required requires
                        });
                    }
                    catch(e) {
                        //Log the error since this happened in an asynchronous callback
                        logger.error(e);
                        
                        //If an error happens we want to make sure the error callback is invoked
                        if (wrappedCallback.error) {
                            wrappedCallback.error.call(thisObj);
                        }
                        return;
                    }
                    
                    //Everything loaded successfully... pass along the required requires to the user's success callback function
                    userSuccessFunc.apply(thisObj, loadedModules);
                };
                
                if (isFunctionCallback) {
                    //A single function as we provided as a callback that is used for both success and error. Thereore, we need to also
                    //wrap the error callback and invoke the provided callback with no arguments to indicate an error
                    wrappedCallback.error = function() {
                        //Call the success callback with no requires to indicate an error
                        userSuccessFunc.call(thisObj);
                    };
                }
                
            }
            
            //Create a new transaction that consists of the requested requires and execute it
            return this.include(
                {
                    requires: requires
                }, 
                wrappedCallback || callback, 
                thisObj);
        }
        
    };
});