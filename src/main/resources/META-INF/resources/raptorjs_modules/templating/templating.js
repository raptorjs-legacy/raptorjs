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

raptor.defineModule('templating', function(raptor) {
    "use strict";
    
    var registeredTemplates = {},
        loadedTemplates = {},
        forEachEntry = raptor.forEachEntry,
        isArray = raptor.isArray,
        strings = raptor.require('strings'),
        escapeXml = raptor.require('xml.utils').escapeXml,
        escapeXmlAttr = raptor.require('xml.utils').escapeXmlAttr,
        Context = raptor.require("templating.Context"),
        templating,
        /**
         * Helper function to check if an object is "empty". Different types of objects are handled differently:
         * 1) null/undefined: Null and undefined objects are considered empty
         * 2) String: The string is trimmed (starting and trailing whitespace is removed) and if the resulting string is an empty string then it is considered empty
         * 3) Array: If the length of the array is 0 then the array is considred empty
         * 
         */
        empty = function(o) {
            if (!o) {
                return true;
            }
            
            if (typeof o === 'string') {
                return !strings.trim(o).length;
            }
            
            if (isArray(o)) {
                return !o.length;
            }
            
            return true;
        };
    
    templating = {
        /**
         * Renders a template to the provided context.
         * 
         * <p>
         * The template specified by the templateName parameter must already have been loaded. The data object
         * is passed to the compiled rendering function of the template. All output is written to the provided
         * context using the "writer" associated with the context.
         * 
         * @param templateName The name of the template to render. The template must have been previously rendered
         * @param data The data object to pass to the template rendering function
         * @param context The context to use for all rendered output (required)
         */
        render: function(templateName, data, context) {
            if (!context) {
                raptor.throwError(new Error("Context is required"));
            }
            
            /*
             * We first need to find the template rendering function. It's possible
             * that the factory function for the template rendering function has been
             * registered but that the template rendering function has not already
             * been created.
             * 
             * The template rendering functions are lazily initialized.
             */
            var templateFunc = loadedTemplates[templateName]; //Look for the template function in the loaded templates lookup
            if (!templateFunc) { //See if the template has already been loaded
                /*
                 * If we didn't find the template function in the loaded template lookup
                 * then it means that the template has not been fully loaded and initialized.
                 * Therefore, check if the template has been registerd with the name provided
                 */
                if ((templateFunc = registeredTemplates[templateName])) { //Check the registered templates lookup to see if a factory function has been register
                    /*
                     * We found that template has been registered so we need to fully initialize it.
                     * To create the template rendering function we must invoke the template factory
                     * function which expects a reference to the static helpers object.
                     * 
                     * NOTE: The factory function allows static private variables to be created once
                     *       and are then made available to the rendering function as part of the
                     *       closure for the rendering function
                     */
                    templateFunc = templateFunc(templating.helpers); //Invoke the factory function to get back the rendering function
                }
                
                if (!templateFunc) {
                    raptor.throwError(new Error('Template not found with name "' + templateName + '"'));
                }
                loadedTemplates[templateName] = templateFunc; //Store the template rendering function in the lookup
            }
            
            try
            {
                templateFunc(data || {}, context, context._helpers); //Invoke the template rendering function with the required arguments
            }
            catch(e) {
                raptor.throwError(new Error('Unable to render template with name "' + templateName + '". Exception: ' + e), e);
            }
        },
        
        /**
         * Renders a template and captures the output as a String
         * 
         * @param templateName {String}The name of the template to render. NOTE: The template must have already been loaded.
         * @param data {Object} The data object to provide to the template rendering function
         * @param context {templating$Context} The context object to use (optional). If a context is provided then the writer will be 
         *                                     temporarily swapped with a StringBuilder to capture the output of rendering. If a context 
         *                                     is not provided then one will be created using the "createContext" method.
         * @returns {String} The string output of the template
         */
        renderToString: function(templateName, data, context) {
            var sb = strings.createStringBuilder(), //Create a StringBuilder object to serve as a buffer for the output
                _this = this;
            
            var _render = function() { //Helper function to simplify code
                _this.render(templateName, data, context);
            };
            
            if (context) {
                /*
                 * If a context is provided then we need to temporarily swap out the writer for the StringBuilder
                 */
                context.swapWriter(sb, _render); //Swap in the writer, render the template and then restore the original writer
            }
            else {
                /*
                 * If a context object is not provided then we need to create a new context object and use the StringBuilder as the writer
                 */
                context = this.createContext(sb);
                _render();
            }
            
            return sb.toString(); //Return the final string associated with the StringBuilder
        },
        
        /**
         * Registers a template factory function and associates it with the
         * provided template name. When the compiled JavaScript code for a 
         * template is evaluated this function will be invoked.
         * 
         * @param name {String} The name of the template
         * @param templateFactoryFunc {Function} The template factory function 
         */
        register: function(name, templateFactoryFunc) {
            registeredTemplates[name] = templateFactoryFunc; //Add the factory function to the lookup
            delete loadedTemplates[name]; //If a template is re-registered then deleted the loaded instance (if any)
        },
        
        /**
         * Creates a new context object that can be used as the context for
         * template rendering.
         * 
         * @param writer {Object} An object that supports a "write" and a "toString" method.
         * @returns {templating$Context} The newly created context object
         */
        createContext: function(writer) {
            var context = new Context(writer); //Create a new context using the writer provided
            
            var contextHelpers = {};
            
            /*
             * Now bind all of the Context helper functions to the correct "this" so that they
             * can be executed directly (i.e. "func()" instead of "context.func()")
             */
            forEachEntry(Context.helpers, function(name, func) {
                contextHelpers[name] = function() {
                    return func.apply(context, arguments); //Proxy the arguments to the real function and use the "context" object for the "this" object
                };
            });
            
            context._helpers = contextHelpers; //Associate the bound helpers with the context
            return context; //Return the newly created context
        },
        
        /**
         * 
         */
        helpers: {
            /**
             * Helper function to return the singelton instance of a tag handler
             * 
             * @param name The class name of the tag handler
             * @returns {Object} The tag handler singleton instance.
             */
            h: function(name) {
                var Handler = raptor.require(name), //Load the handler class
                    instance;
                
                if (!(instance = Handler.instance)) { //See if an instance has already been created
                    instance = Handler.instance = new Handler(); //If not, create and store a new instance
                }
                
                return instance; //Return the handler instance
            },
            
            /**
             * forEach helper function
             * 
             * @param list {Array} The array to iterate over
             * @param callback {Function} The callback function to invoke for each iteration 
             * @returns {void}
             */
            f: function(list, callback) {
                if (!list) return;
                if (!isArray(list)) {
                    list = [list];
                }
                
                var i=0, 
                    len=list.length, //Cache the list size
                    loopStatus = { //The "loop status" object is provided as the second argument to the callback function used for each iteration
                        /**
                         * Returns the length of the array that is being iterated over
                         * @returns {int} The length of the array
                         */
                        getLength: function() {
                            return len;
                        },
                        
                        /**
                         * Returns true if the current iteration is the last iteration
                         * @returns {Boolean} True if the current iteration is the last iteration. False, otherwse.
                         */
                        isLast: function() {
                            return i === len-1;
                        },
                        isFirst: function() {
                            return i === 0;
                        },
                        getIndex: function() {
                            return i;
                        }
                    };
                
                for (; i<len; i++) { //Loop over the elements in the array
                    var o = list[i];
                    callback(o || '', loopStatus);
                }
            },
            
            e: empty,
            
            ne: function(o) {
                return !empty(o);
            },
            
            /**
             * escapeXml helper function
             * 
             * @param str
             * @returns
             */
            x: escapeXml,
            xa: escapeXmlAttr,
            
            nx: function(str) {
                return {
                    toString: function() {
                        return str;
                    }
                };
            }
        }
    };
    
    return templating;
    
});

raptor.global.$rtmpl = function(name, func) {
    "use strict";
    raptor.require('templating').register(name, func);
};
