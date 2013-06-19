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
 * The RaptorJS loader module allows JavaScript, CSS and modules to be included in the page asynchronously after the page
 * has already finished loading. The loader module supports including individual resources or including multiple resources
 * of possibly mixed types as a single transaction. 
 * 
 * <p>
 * When including a resource or a set of resources a callback can
 * be provided to track the progress of the include. 
 * 
 * 
 */
define('raptor/loader', ['raptor'], function(raptor, require, exports, module) {
    "use strict";
    
    var included = {},
        downloaded = {},
        forEach = raptor.forEach,
        forEachEntry = raptor.forEachEntry,
        listeners = require('raptor/listeners'),
        events = ['asyncStart', 'asyncComplete', 'success', 'error', 'complete'],
        _createAsyncCallback = function(callback, thisObj) {
            var observable = listeners.createObservable(events, true);
            if (callback) {
                if (typeof callback === 'function') {
                    observable.complete(callback, thisObj);
                }
                else {
                    //Assume the callback is an object
                    observable.subscribe(callback, thisObj);
                }
            }
            return observable;
        },
        progressEvents = listeners.createObservable(),
        _handleUrlStart = function(url, callback) {
            var data = downloaded[url];
                
            if (data) {

                if (data.success) {
                    callback.success(data);
                }
                else {
                    callback.error(data);
                }
                callback.complete(data);
                return true;
            }
            else if ((data = included[url])) {
                callback.asyncStart(data);
                
                //Piggy-back off the existing include for the remaining events
                forEach(
                    events,
                    function(event) {
                        if (event === 'asyncStart') {
                            //Skip the "asyncStart" event since already handled that
                            return;
                        }
                        progressEvents.subscribe(event + ':' + url, function(data) {
                            callback.publish(event, data);
                        }, this, true /*auto remove*/);
                    }, this);
                return true;
            }

            included[url] = data = {url: url, completed: false};
            
            callback.asyncStart(data);
            return false;
        },
        _handleUrlComplete = function(url, isSuccess, callback) {
            var data = included[url];
            delete included[url];
            
            data.success = isSuccess;
            data.complete = true;
            
            var _publish = function(event) {
                callback[event](data);
                progressEvents.publish(event + ':' + url, data);
            };
            
            if (isSuccess) {
                downloaded[url] = data;
                _publish('success');
                
            }
            else {
                _publish('error');
            }
            
            _publish('asyncComplete');
            _publish('complete');
        },
        _createImplCallback = function(url, callback) {
            return {
                success: function() {
                    _handleUrlComplete(url, true, callback);
                },
                error: function() {
                    _handleUrlComplete(url, false, callback);
                }
            };
        };
        
    /**
     * A transaction consisting of resources to be included.
     * 
     * @class
     * @anonymous
     * @name raptor/loaderTransaction
     * 
     * @param loader {loader} The loader module that started this transaction 
     */
    var Transaction = function(loader) {
        
        var _includes = [],
            _included = {},
            started,
            _this = {
                
                /**
                 * Adds a include to the transaction
                 * 
                 * @param url {String} The URL/ID of the include
                 * @param include {Object} The data for the include
                 * @param includeFunc The function to actually include the resource (a callback will be provided)
                 * @param thisObj The "this" object ot use for the includeFunc arg
                 */
                _add: function(url, include, includeFunc, thisObj) {
                    if (started || _included[url]) {
                        return;
                    }
                    
                    _included[url] = 1;
                    
                    _includes.push(function(callback) {
                        if (_handleUrlStart(url, callback)) {
                            return;
                        }
                        
                        includeFunc.call(
                                thisObj, 
                                include, 
                                _createImplCallback(url, callback));
                    });
                },
                
                /**
                 * 
                 * @param url
                 * @returns {Boolean} Returns true if the  URL has already been included as part of this transaction. False, otherwise.
                 */
                isIncluded: function(url) {
                    return !!_included[url];
                },
                
                /**
                 * Marks a URL as included
                 * 
                 * @param url The URL to mark as included
                 */
                setIncluded: function(url) {
                    _included[url] = 1;
                },
                
                /**
                 * 
                 * @param type The resource type (e.g. "js", "css" or "module"
                 * @param includes {Object|Array} The array of includes or a single include 
                 */
                add: function(type, includes) {
                    
                    var handler = loader["handle_" + type];
                    
                    if (handler == null) {
                        throw new Error("Invalid type: " + type);
                    }
                    
                    forEach(includes, function(include) {
                        handler.call(loader, include, _this);
                    });
                },
                        
                /**
                 * 
                 * @param userCallback
                 * @returns {raptor/loader/Transaction} Returns itself
                 */
                execute: function(userCallback) {
                    started = 1;
                    
                    var failed = [],
                        status = {failed: failed};
                    
                    if (!_includes.length) {
                        userCallback.success(status);
                        userCallback.complete(status);
                    }
                    
                    var completedCount = 0,
                        asyncStarted = false,
                        callback = _createAsyncCallback({
                                asyncStart: function() {
                                    if (!asyncStarted) {
                                        asyncStarted = true;
                                        userCallback.asyncStart(status);
                                    }
                                },
                                error: function(url) {
                                    failed.push(url);
                                }, 
                                complete: function() {
                                    completedCount++;
                                    if (completedCount === _includes.length) {
                                        
                                        if ((status.success = !failed.length)) {
                                            userCallback.success(status);
                                        }
                                        else {
                                            userCallback.error(status);
                                        }
                                        
                                        if (asyncStarted) {
                                            userCallback.asyncComplete(status);
                                        }
            
                                        userCallback.complete(status);
                                    }
                                }
                            });
                    
                    
                    
                    forEach(_includes, function(execFunc) {
                        execFunc(callback);
                    });
                    return _this;
                }
            };
        
        return _this;
    };

    return {
        
        /**
         * 
         * @param url
         * @returns
         */
        isDownloaded: function(url) {
            return downloaded[url] !== undefined;
        },
        
        setDownloaded: function(url){
            if (url){
                downloaded[url] = {
                    url: url,
                    success: true,
                    complete: true
                };
            }
        },
        /**
         * 
         * @param includes
         * @param callback
         * @param thisObj
         * @returns
         */
        include: function(includes, callback, thisObj) {
            var transaction = new Transaction(this);
            
            if (this.beforeInclude) {
                this.beforeInclude();
            }

            forEachEntry(includes, function(type, includesForType) {
                transaction.add(type, includesForType);
            });

            return transaction.execute(_createAsyncCallback(callback, thisObj));
        }
    };
});