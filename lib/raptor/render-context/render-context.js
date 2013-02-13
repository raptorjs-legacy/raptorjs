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
define('raptor/render-context', function(require, exports, module) {
    "use strict";
    
    var StringBuilder = require('raptor/strings/StringBuilder'),
        Context = require('raptor/render-context/Context');
    
    
    return {
        /**
         * Creates a new context object that can be used as the context for
         * template rendering.
         * 
         * @param writer {Object} An object that supports a "write" and a "toString" method.
         * @returns {raptor/render-context/Context} The newly created context object
         */
        createContext: function(writer) {
            return new Context(writer || new StringBuilder()); //Create a new context using the writer provided
        },
        
        Context: Context
    };
    
});
