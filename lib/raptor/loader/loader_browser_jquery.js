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
 * @extension jQuery
 */
define.extend('raptor/loader', function(require) {
    "use strict";
    
    var extend = require('raptor').extend,
        logger = require('raptor/logging').logger('raptor/loader');
    
    return {
        /**
         * 
         * @param src
         * @param callback
         * @returns
         * 
         * @protected
         */
        includeJSImpl: function(src, callback) {
            $.ajax({
                url: src,
                dataType: "script",
                crossDomain: true,
                cache: true,
                success: function(result) {
                    logger.debug('Downloaded: "' + src + '"');
                    
                    //Let the loader module know that the resource has included successfully
                    callback.success();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    logger.error('Failed: "' + src + '": ' + errorThrown);
                    //Let the loader module know that the resource was failed to be included
                    callback.error();
                }
            });
        },
        
        /**
         * 
         * @param href
         * @param callback
         * @param attributes
         * @returns
         * 
         * @protected
         */
        includeCSSImpl: function(href, callback, attributes) {

            var retries = 20;
            
            var complete = false,
                _this = this;
            
            var el;

            var cleanup;

            function success() {
                if (complete === false) {                    
                    complete = true;
                    cleanup();
                    logger.debug('Downloaded: "' + href + '"');
                    //Let the loader module know that the resource has included successfully
                    callback.success();
                }
            };

            if (document.createStyleSheet) {

                cleanup = function() {

                    if (document.addEventListener) {

                        if (onLoad) {
                            document.removeEventListener('load', onLoad);
                        }

                        if (onReadyStateChange) {
                            document.removeEventListener('readystatechange', onReadyStateChange);
                        }

                    } else {

                        if (onLoad) {
                            document.detachEvent('onload', onLoad);
                        }

                        if (onReadyStateChange) {
                            document.detachEvent('onreadystatechange', onReadyStateChange);
                        }
                    }

                    onLoad = null;
                    onReadyStateChange = null;
                };
                
                // IE method of creating stylesheets
                el = document.createStyleSheet(href);

                if (attributes) {
                    extend(el, attributes);
                }

                var readyState = document.readyState;
                if ("loaded" === readyState || "complete" === readyState) {
                    success();
                } else {

                    var onReadyStateChange = function() {
                        var readyState = document.readyState;
                        if ("loaded" === readyState || "complete" === readyState) {
                            success();
                        }
                    };

                    var onLoad = function() {
                        success();
                    }

                    if (document.addEventListener) {
                        document.addEventListener('load', onLoad);
                        document.addEventListener('readystatechange', onReadyStateChange);
                    } else {
                        document.attachEvent('onload', onLoad);
                        document.attachEvent('onreadystatechange', onReadyStateChange);
                    }
                }

            } else {

                cleanup = function() {
                    el.onload = null;
                    el.onreadystatechange = null;
                    el.onerror = null;
                }

                el = document.createElement('link');
                
                var isLoaded = function() {
                    var sheets = document.styleSheets;
                    for (var idx = 0, len = sheets.length; idx < len; idx++) {
                        if (sheets[idx].href === href) {
                            return true;
                        }
                    }
                    return false;
                };

                var error = function() {
                    logger.error('Failed: "' + href + '"');
                    if (complete === false)
                    {                    
                        complete = true; 
                        cleanup();
                        //Let the loader module know that the resource was failed to be included
                        callback.error();
                    }
                };
                
                extend(el, {
                    type: 'text/css',
                    rel: "stylesheet",
                    href: href
                });
                
                if (attributes) {
                    extend(el, attributes);
                }
                
                if (navigator.appName == 'Microsoft Internet Explorer') {
                    el.onload = success;                
                    el.onreadystatechange = function() {
                        var readyState = this.readyState;
                        if ("loaded" === readyState || "complete" === readyState) {
                            success();
                        }
                    };
                }
                else
                {
                    var pollSuccess = function() {
                        if (complete === false) {
                            if (!isLoaded() && (retries--)) {
                                return window.setTimeout(pollSuccess,10);
                            }
                            success();
                        }
                    };

                    //For non-IE browsers we don't get the "onload" and "onreadystatechange" events...
                    pollSuccess();
                }
                
                el.onerror = error;   

                $(function() {
                    $("head").append(el);
                });
            }
        }
    };
});