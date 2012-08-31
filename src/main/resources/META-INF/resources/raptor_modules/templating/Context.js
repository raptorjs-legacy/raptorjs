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
            StringBuilder = strings.StringBuilder,
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
            this.w = this.write;
        };

        Context.prototype = {
            getAttributes: function() {
                return this.attributes || (this.attributes = {});
            },
            
            events: function() {
                if (!this.events) {
                    this.events = listeners.createObservable();
                }
                return this.events;
            },
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
                if (str !== null && str !== undefined) {
                    if (typeof str !== 'string') {
                        str = str.toString();
                    }
                    this.writer.write(str);
                }
                return this;
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
                var sb = new StringBuilder();
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
                if (!this._helpers) {
                    this._helpers = {};
                }
                
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
                return this;
            },
            
            attr: function(name, value) {
                if (value === null) {
                    value = '';
                }
                else if (value === undefined || typeof value === 'string' && value.trim() === '') {
                    return this;
                }
                else {
                    value = '="' + escapeXmlAttr(value) + '"';
                }
                
                this.write(' ' + name + value);
                
                return this;
            },
            
            /**
             * 
             * @param attrs
             */
            attrs: function(attrs) {
                if (arguments.length === 2) {
                    this.attr.apply(this, arguments);
                }
                else if (attrs) {
                    forEachEntry(attrs, this.attr, this);    
                }
                return this;
            },
            
            /**
             * Helper function invoke a tag handler
             */
            t: function(handler, props, body, dynamicAttributes, namespacedProps) {
                if (!props) {
                    props = {};
                }
                
                props._tag = true;
                
                props.invokeBody = body;
                if (dynamicAttributes) {
                    props.dynamicAttributes = dynamicAttributes;
                }
                
                if (namespacedProps) {
                    raptor.extend(props, namespacedProps);
                }
                
                this.invokeHandler(handler, props);
                
                return this;
            },
            
            c: function(func) {
                var output = this.captureString(func);
                return {
                    toString: function() { return output; }
                };
            }
        };
        
        var proto = Context.prototype;
        proto.a = proto.attrs;
        proto.h = proto.getFunction;
        proto.i = proto.renderTemplate;
        
        return Context;
        
    });