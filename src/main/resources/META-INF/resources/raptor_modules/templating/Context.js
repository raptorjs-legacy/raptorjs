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

raptor.defineClass(
    'templating.Context',
    function(raptor) {
        "use strict";
        
        var forEachEntry = raptor.forEachEntry,
            escapeXmlAttr = raptor.require("xml.utils").escapeXmlAttr,
            strings = raptor.require('strings'),
            listeners = raptor.require('listeners'),
            nextUniqueId = 0,
            helpers,
            bind = function(func, context) {
                return function() {
                    return func.apply(context, arguments); //Proxy the arguments to the real function and use the "context" object for the "this" object
                };
            };
        
        /**
         * 
         */
        var Context = function(writer) {
            this.writer = writer;
            var _this = this;
            this.attributes = {};
            listeners.makeObservable(this, Context.prototype);
            
            var contextHelpers = {};
            
            /*
             * Now bind all of the Context helper functions to the correct "this" so that they
             * can be executed directly (i.e. "func()" instead of "context.func()")
             */
            forEachEntry(helpers, function(name, func) {
                contextHelpers[name] = bind(func, _this);
            });
            
            this._helpers = contextHelpers; //Associate the bound helpers with the context
        };

        Context.prototype = {
            /**
             * 
             * @returns {Number}
             */
            uniqueId: function() {
                return nextUniqueId++;
            },
            
            /**
             * 
             * @param str
             */
            write: function(str) {
                if (str == null) {
                    return;
                }
                this.writer.write(str);
                
            },
            
            getOutput: function() {
                return this.writer.toString();
            },
            
            /**
             * 
             * @param func
             * @param thisObj
             * @returns
             */
            captureString: function(func, thisObj) {
                var sb = strings.createStringBuilder();
                this.swapWriter(sb, func, thisObj);
                return sb.toString();
            },
            
            /**
             * 
             * @param newWriter
             * @param func
             * @param thisObj
             */
            swapWriter: function(newWriter, func, thisObj) {
                var oldWriter = this.writer;
                try
                {
                    this.writer = newWriter;
                    func.call(thisObj);
                }
                finally {
                    this.writer = oldWriter;
                }
            },
            
            /**
             * 
             * @param handler
             * @param props
             * @param body
             */
            invokeHandler: function(handler, props) {
                handler.process(props, this);
            },

            getFunction: function(className, name) {
                var key = className + ":" + name,
                    helper = this._helpers[key],
                    unboundHelper;
                
                if (!helper) {
                    if (arguments.length === 1) {
                        unboundHelper = helpers[className];
                    }
                    else {
                        unboundHelper = raptor.require("templating").getFunction(className, name);
                    }
                    
                    helper = this._helpers[key] = bind(unboundHelper, this);
                }
                
                return helper;
            },
            
            isTagInput: function(input) {
                return input && input.hasOwnProperty("_tag");
            },
            
            renderTemplate: function(name, data) {
                raptor.require("templating").render(name, data, this);
            }
        };
        
        Context.namespacedHelpers = helpers = {
                /**
                 * Helper function to write out a string to the context
                 * @param str
                 * @returns
                 */
                w: function(str) {
                    this.write(str);
                    return this._helpers.w;
                },
                
//                w: function() {
//                    for (var args = arguments, i=0, len=args.length; i<len; i++) {
//                        this.write(args[i]);
//                    }
//                    return _helpers.w;
//                },
                /**
                 * Helper function to return a namespaced helper function
                 * @param uri
                 * @param name
                 * @returns
                 */
                h: function(uri, name) {
                    return this.getFunction(uri, name);
                },
                
                /**
                 * Helper function invoke a tag handler
                 */
                t: function(handler, props, body, namespacedProps) {
                    if (!props) {
                        props = {};
                    }
                    
                    props._tag = true;
                    
                    props.invokeBody = body;
                    if (namespacedProps) {
                        raptor.extend(props, namespacedProps);
                    }
                    
                    this.invokeHandler(handler, props);
                },
                
                /**
                 * Helper function to render dynamic attributes
                 * @param attrs
                 */
                a: function(attrs) {
                    if (!attrs) {
                        return;
                    }
                    
                    forEachEntry(attrs, function(name, value) {
                        if (value === undefined) {
                            return;
                        }
                        
                        this.write(' ' + name + (value === null ? '' : ('="' + escapeXmlAttr(value) + '"')));
                    }, this);
                },
                
                /**
                 * Helper function to include another template
                 * 
                 * @param name
                 * @param data
                 */
                i: function(name, data) {
                    this.renderTemplate(name, data);
                },
                
                c: function(func) {
                    var output = this.captureString(func);
                    return {
                        toString: function() { return output; }
                    };
                }
            };
        
        return Context;
        
    });