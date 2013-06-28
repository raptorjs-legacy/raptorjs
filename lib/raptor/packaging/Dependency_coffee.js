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
    "raptor/packaging/Dependency_coffee",
    "raptor/packaging/Dependency",
    function(require, exports, module) {
        "use strict";
        
        var Dependency_coffee = function() {
            Dependency_coffee.superclass.constructor.apply(this, arguments);
            this.addProperty("path", {
                type: "string"
            });
        };
        
        Dependency_coffee.prototype = {
            getKey: function(context) {
                return "coffee:" + this.resolvePathKey(this.path, context);
            },
            
            toString: function(dependency) {
                return this.getResource().getPath();
            },
            
            load: function(context) {
                // Ensure the ".coffee" require extension for Node are enabled
                require('coffee-script');

                // Delegate loading to the standard JavaScript resource loader
                Dependency_coffee.superclass.load.apply(this, arguments);
            },
            
            getContentType: function() {
                return "application/javascript";
            },
            
                        
            getResourcePath: function() {
                return this.path;
            },
            
            getCode: function(context) {
                var resource = this.getResource(context);
                var source = resource.readAsString("UTF-8");
                var coffeeJs = require("coffee-script").compile(source, {bare:true});
                return coffeeJs;
            },
            
            isCompiled: function() {
                return true;
            }
        };
        
        return Dependency_coffee;
    });
