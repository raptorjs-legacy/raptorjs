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

define.Class(
    "raptor/packaging/Dependency_i18n",
    "raptor/packaging/Dependency",
    function(require, exports, module) {
        "use strict";
        
        var Dependency_i18n = function() {
            Dependency_i18n.superclass.constructor.apply(this, arguments);

            // define property that will allow developer to name dictionary (instead of using resource path)
            this.addProperty("name", {
                type: "string"
            });
            
            this.addProperty("path", {
                type: "string"
            });
        };
        
        Dependency_i18n.prototype = {
            getKey: function(context) {
                return "i18n:" + this.resolvePathKey(this.path, context);
            },
            
            toString: function(dependency) {
                return this.getResource().getPath();
            },
            
            load: function(context) {
            },
            
            getContentType: function() {
                return "application/javascript";
            },
                        
            getResourcePath: function() {
                return this.path;
            },
            
            getCode: function(context) {
                
                return null;
            },
            
            isCompiled: function() {
                return true;
            }
        };
        
        return Dependency_i18n;
    });
