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
    "raptor/packaging/Dependency_rhtml",
    "raptor/packaging/Dependency",
    function(require, exports, module) {
        "use strict";
        
        var Dependency_rhtml = function() {
            Dependency_rhtml.superclass.constructor.apply(this, arguments);
            this.addProperty("path", {
                type: "string"
            });
        };
        
        Dependency_rhtml.prototype = {
            getKey: function(context) {
                return "rhtml:" + this.resolvePathKey(this.path, context);
            },
            
            toString: function(dependency) {
                return this.getResource().getPath();
            },
            
            load: function(context) {
                var resource = this.getResource();
                var xmlSource = resource.readAsString("UTF-8");
                require("raptor/templating/compiler").compileAndLoad(xmlSource, resource.getURL());
            },
            
            getContentType: function() {
                return "application/javascript";
            },
            
                        
            getResourcePath: function() {
                return this.path;
            },
            
            getCode: function(context) {
                var resource = this.getResource(context);
                var xmlSource = resource.readAsString("UTF-8");
                var rhtmlJs = require("raptor/templating/compiler").compile(xmlSource, resource.getURL());
                return rhtmlJs;
            },
            
            isCompiled: function() {
                return true;
            }
        };
        
        return Dependency_rhtml;
    });
