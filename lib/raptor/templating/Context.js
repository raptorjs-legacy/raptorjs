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
 * The {@link templating.Context} class represents a "rendering context". 
 * A context object is required when rendering a template and the context
 * object contains a reference to an underlying writer object that is
 * used to capture the rendered output.
 */
define.Class(
    'raptor/templating/Context',
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var forEachEntry = raptor.forEachEntry,
            escapeXmlAttr = require('raptor/xml/utils').escapeXmlAttr,
            StringBuilder = require('raptor/strings/StringBuilder'),
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
            /**
             * Returns the attributes object associated with the context.
             * 
             * The attributes object is just a regular JavaScript Object that can be used to store arbitrary data.
             * 
             * @returns {Object} The attribute object.
             */
            getAttributes: function() {
                return this.attributes || (this.attributes = {});
            },

            /**
             * Returns a auto-incrementing unique ID that remains unique across multiple context objects. 
             * @returns {Number} The unique number
             */
            uniqueId: function() {
                return nextUniqueId++;
            },
            
            /**
             * Outputs a string to the underlying writer. If the object is null then nothing is written. If the object is not a string then it is converted to a string using the <code>toString</code> method.
             *  
             * @param str {String|Object} The String (or Object) to write to the underlying writer.
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
            
            /**
             * Returns the string output associated with the underling writer by calling <code>this.writer.toString()</code>
             * 
             * @returns {String} The String output
             */
            getOutput: function() {
                return this.writer.toString();
            },
            
            /**
             * 
             * Temporarily swaps out the underlying writer with a temporary buffer and invokes the provided function to capture the output and return it. 
             * 
             * After the function has completed the old writer is swapped back into place. The old writer will remain untouched. 
             * Internally, this method uses the {@link templating.Context.prototype#swapWriter} method.
             * 
             * @param func {Function} The function to invoke while the old writer is swapped out
             * @param thisObj {Object} The "this" object ot use for the provided function
             * @returns {String} The resulting string output.
             */
            captureString: function(func, thisObj) {
                var sb = new StringBuilder();
                this.swapWriter(sb, func, thisObj);
                return sb.toString();
            },
            
            /**
             * Temporarily swaps out the underlying writer with the provided writer and invokes the provided function. 
             * 
             * After the function has completed the old writer is swapped back into place. The old writer will remain untouched. 
             * 
             * @param newWriter {Object} The new writer object to use. This object must have a "write" method.
             * @param func {Function} The function to invoke while the old writer is swapped out
             * @param thisObj {Object} The "this" object ot use for the provided function
             * 
             * @returns {void}
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
                        unboundHelper = require("raptor/templating").getFunction(className, name);
                    }
                    
                    helper = this._helpers[key] = bind(unboundHelper, this);
                }
                
                return helper;
            },
            
            isTagInput: function(input) {
                return input && input.hasOwnProperty("_tag");
            },
            
            renderTemplate: function(name, data) {
                require("raptor/templating").render(name, data, this);
                return this;
            },
            
            attr: function(name, value, escapeXml) {
                if (value === null) {
                    value = '';
                }
                else if (value === undefined || typeof value === 'string' && value.trim() === '') {
                    return this;
                }
                else {
                    value = '="' + (escapeXml === false ? value : escapeXmlAttr(value)) + '"';
                }
                
                this.write(' ' + name + value);
                
                return this;
            },
            
            /**
             * 
             * @param attrs
             */
            attrs: function(attrs) {
                if (arguments.length !== 1) {
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