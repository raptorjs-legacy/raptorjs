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
 * The {@link raptor/render-context/Context} class represents a "rendering context"
 * suitable for rendering HTML to a writer. A context object is required when rendering 
 * a template and the context object contains a reference to an underlying writer object that is
 * used to capture the rendered output.
 */
define.Class(
    'raptor/render-context/Context',
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var forEachEntry = raptor.forEachEntry,
            escapeXmlAttr = require('raptor/xml/utils').escapeXmlAttr,
            StringBuilder = require('raptor/strings/StringBuilder'),
            createError = raptor.createError,
            nextUniqueId = 0,
            _classFunc = function(className, name) {
                var Clazz = require(className),
                    func = Clazz[name] || (Clazz.prototype && Clazz.prototype[name]);
                
                if (!func) {
                    throw createError(new Error('Helper function not found with name "' + name + '" in class "' + className + '"'));
                }
                return func;
            };
        
        /**
         * 
         */
        var Context = function(writer) {
            this.writer = writer;
            this.w = this.write;
            this.listeners = {};
            this.attributes = {};
        };
        
        Context.classFunc =  _classFunc;

        var proto = {
            /**
             * Returns the attributes object associated with the context.
             * 
             * The attributes object is just a regular JavaScript Object that can be used to store arbitrary data.
             * 
             * @returns {Object} The attribute object.
             */
            getAttributes: function(name) {
                return this.attributes;
            },

            /**
             * Returns a auto-incrementing unique ID that remains unique across multiple context objects. 
             * @returns {Number} The unique number
             */
            uniqueId: function() {
                return 'c' + nextUniqueId++;
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
             * Internally, this method uses the {@link raptor/render-context/Context.prototype#swapWriter} method.
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

            createNestedContext: function(writer) {
                var context = require('raptor/render-context').createContext(writer);
                context.attributes = this.getAttributes();
                return context;
            },
            
            /**
             * 
             * @param handler
             * @param input
             */
            invokeHandler: function(handler, input) {
                if (typeof handler === 'string') {
                    handler = require(handler);
                }
                var func = handler.process || handler.render;
                func.call(handler, input, this);
            },

            getFunction: function(className, name) {
                if (!this._helpers) {
                    this._helpers = {};
                }
                
                var key = className + ":" + name,
                    helper = this._helpers[key];
                
                if (!helper) {
                    helper = this._helpers[key] = _classFunc(className, name).bind(this);
                }
                
                return helper;
            },

            getHelperObject: function(className) {
                if (!this._helpers) {
                    this._helpers = {};
                }
                
                var Helper = this._helpers[className] || (this._helpers[className] = require(className));
                return new Helper(this);
            },
            
            isTagInput: function(input) {
                return input && input.hasOwnProperty("_tag");
            },
            
            renderTemplate: function(name, data) {
                require("raptor/templating").render(name, data, this);
                return this;
            },
            
            attr: function(name, value, escapeXml) {
                if (value === null || value === true) {
                    value = '';
                }
                else if (value === undefined || value === false || (typeof value === 'string' && value.trim() === '')) {
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
                
                if (body) {
                    props.invokeBody = body;    
                }
                
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
        
        // Add short-hand method names that should be used in compiled templates *only*
        proto.a = proto.attrs;
        proto.f = proto.getFunction;
        proto.o = proto.getHelperObject;
        proto.i = proto.renderTemplate;
        
        Context.prototype = proto;

        
        
        return Context;
        
    });