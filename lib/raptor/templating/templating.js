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
 * This module provides the runtime for rendering compiled templates.
 *
 *
 * <p>The code for the Raptor Templates compiler is kept separately
 * in the {@link raptor/templating/compiler} module.
 */
define('raptor/templating', ['raptor'], function (raptor, require, exports, module) {
    'use strict';
    var getRegisteredTemplate = function (name) {
            return $rget('rhtml', name);
        }, loadedTemplates = {}, isArray = Array.isArray, createError = raptor.createError, StringBuilder = require('raptor/strings/StringBuilder'), escapeXml = require('raptor/xml/utils').escapeXml, escapeXmlAttr = require('raptor/xml/utils').escapeXmlAttr, renderContext = require('raptor/render-context'), Context = renderContext.Context, _getFunction = Context.classFunc, templating,
        /**
         * Helper function to return the singleton instance of a tag handler
         *
         * @param name {String} The class name of the tag handler
         * @returns {Object} The tag handler singleton instance.
         */
        _getHandler = function (name) {
            var Handler = require(name),
                //Load the handler class
                instance;
            if (Handler.process || Handler.render) {
                instance = Handler;
            } else if (!(instance = Handler.instance)) {
                //See if an instance has already been created
                instance = Handler.instance = new Handler();    //If not, create and store a new instance
            }
            return instance;    //Return the handler instance
        },
        /**
         * Helper function to check if an object is "empty". Different types of objects are handled differently:
         * 1) null/undefined: Null and undefined objects are considered empty
         * 2) String: The string is trimmed (starting and trailing whitespace is removed) and if the resulting string is an empty string then it is considered empty
         * 3) Array: If the length of the array is 0 then the array is considred empty
         *
         */
        notEmpty = function (o) {
            if (Array.isArray(o) === true) {
                return o.length !== 0;
            }
            return o;
        }, helpers = {
            h: _getFunction,
            t: _getHandler,
            fv: function (array, callback) {
                if (!array) {
                    return;
                }
                if (!array.forEach) {
                    array = [array];
                }
                var i = 0, len = array.length,
                    //Cache the array size
                    loopStatus = {
                        getLength: function () {
                            return len;
                        },
                        isLast: function () {
                            return i === len - 1;
                        },
                        isFirst: function () {
                            return i === 0;
                        },
                        getIndex: function () {
                            return i;
                        }
                    };
                for (; i < len; i++) {
                    //Loop over the elements in the array
                    var o = array[i];
                    callback(o || '', loopStatus);
                }
            },
            f: raptor.forEach,
            fl: function (array, func) {
                if (array != null) {
                    if (!isArray(array)) {
                        array = [array];
                    }
                    func(array, 0, array.length);
                }
            },
            fp: function (o, func) {
                if (!o) {
                    return;
                }
                for (var k in o) {
                    if (o.hasOwnProperty(k)) {
                        func(k, o[k]);
                    }
                }
            },
            e: function (o) {
                return !notEmpty(o);
            },
            ne: notEmpty,
            x: escapeXml,
            xa: escapeXmlAttr,
            nx: function (str) {
                return {
                    toString: function () {
                        return str;
                    }
                };
            }
        };
    templating = {
        templateFunc: function (templateName) {
            /*
             * We first need to find the template rendering function. It's possible
             * that the factory function for the template rendering function has been
             * registered but that the template rendering function has not already
             * been created.
             *
             * The template rendering functions are lazily initialized.
             */
            var templateFunc = loadedTemplates[templateName];
            //Look for the template function in the loaded templates lookup
            if (!templateFunc) {
                //See if the template has already been loaded
                /*
                 * If we didn't find the template function in the loaded template lookup
                 * then it means that the template has not been fully loaded and initialized.
                 * Therefore, check if the template has been registerd with the name provided
                 */
                templateFunc = getRegisteredTemplate(templateName);
                if (!templateFunc && this.findTemplate) {
                    this.findTemplate(templateName);
                    templateFunc = getRegisteredTemplate(templateName);
                }
                if (templateFunc) {
                    //Check the registered templates lookup to see if a factory function has been register
                    /*
                     * We found that template has been registered so we need to fully initialize it.
                     * To create the template rendering function we must invoke the template factory
                     * function which expects a reference to the static helpers object.
                     *
                     * NOTE: The factory function allows static private variables to be created once
                     *       and are then made available to the rendering function as part of the
                     *       closure for the rendering function
                     */
                    var templateInfo = this.getTemplateInfo(templateName);
                    templateFunc = templateFunc(helpers, templateInfo);    //Invoke the factory function to get back the rendering function
                }
                if (!templateFunc) {
                    throw createError(new Error('Template not found with name "' + templateName + '"'));
                }
                loadedTemplates[templateName] = templateFunc;    //Store the template rendering function in the lookup
            }
            return templateFunc;
        },
        getTemplateInfo: function (templateName) {
            return { name: templateName };
        },
        render: function (templateName, data, context) {
            if (!context) {
                throw createError(new Error('Context is required'));
            }
            var templateFunc = this.templateFunc(templateName);
            try {
                templateFunc(data || {}, context);    //Invoke the template rendering function with the required arguments
            } catch (e) {
                throw createError(new Error('Unable to render template with name "' + templateName + '". Exception: ' + e), e);
            }
        },
        renderToString: function (templateName, data, context) {
            var sb = new StringBuilder();
            //Create a StringBuilder object to serve as a buffer for the output
            if (context === undefined) {
                /*
                 * If a context object is not provided then we need to create a new context object and use the StringBuilder as the writer
                 */
                this.render(templateName, data, new Context(sb));
            } else {
                var _this = this;
                /*
                 * If a context is provided then we need to temporarily swap out the writer for the StringBuilder
                 */
                context.swapWriter(sb, function () {
                    _this.render(templateName, data, context);
                });    //Swap in the writer, render the template and then restore the original writer
            }
            return sb.toString();    //Return the final string associated with the StringBuilder
        },
        unload: function (templateName) {
            delete loadedTemplates[templateName];
            $rset('rhtml', templateName, undefined);
        },
        getFunction: _getFunction,
        createContext: renderContext.createContext,
        getHandler: _getHandler,
        helpers: helpers
    };
    return templating;
});