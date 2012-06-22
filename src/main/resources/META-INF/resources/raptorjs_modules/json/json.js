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
 * Provides JSON stringify and parse methods. When available, the browser's native
 * methods will be used. If the jQuery extension is loaded then the jQuery.parseJSON
 * method will be used. Raptor also provides custom parse and stringify methods
 * can be optionally included.
 */
raptor.define('json', function(raptor) {
    "use strict";
    
    var NativeJSON = raptor.global.JSON,
        PARSE = 'parse',
        STRINGIFY = 'stringify',
        implementations = {},
        methods,
        registerImplementation,
        json = {
            /**
             * @funtion
             * @param o {Object} The object to stringify
             * @returns {String} The JSON string representation of the provided object
             */
            stringify: null,
            
            /**
             * 
             * @function
             * 
             * @param s {String} The JSON string to parse
             * @returns {Object} The native JavaScript object that represents the JSON string
             */
            parse: null,
            
            /**
             * 
             * @param name
             * @param funcType
             * @param func
             * @protected
             */
            registerImpl: function(name) {
                registerImplementation.apply(null, arguments);
            }
        },
        setImplementation = function(name) {
            var impl = implementations[name];
            if (impl) {
                json[STRINGIFY] = impl[STRINGIFY] || json[STRINGIFY];
                json[PARSE] = impl[PARSE] || json[PARSE];
            }
            else {
                raptor.errors.throwError(new Error('JSON implementation not found: ' + name));
            }
            
        };
        
    registerImplementation = function(name, funcType, func) {
        var impl = implementations[name];
        if (!impl) {
            impl = implementations[name] = {};
        }
        impl[funcType] = func;
        
        if (!json[funcType]) {
            //Default to the first available implementation
            json[funcType] = func;
        }
        methods[funcType].push(func);
    };
    
    methods = {};
    methods[PARSE] = [];
    methods[STRINGIFY] = [];
    
    if (NativeJSON) {
        registerImplementation("native", PARSE, function(json) {
            return NativeJSON.parse.call(NativeJSON, json);
        });
        
        registerImplementation("native", STRINGIFY, function(o) {
            return NativeJSON.stringify.call(NativeJSON, o);
        });
    }

    if (raptor.config) {
        
        var moduleConfig = raptor.getModuleConfig('json') || {};
        
        /**
         * @field
         * @type config-Config
         */
        json.config = raptor.config.create();
        
        json.config.add({
            "impl": {
                value: moduleConfig.impl || "native", //Default to the custom JSON (if available)
                onChange: function(value) {
                    setImplementation(value);
                }
            }
        });
    }
    
    return json;
});
