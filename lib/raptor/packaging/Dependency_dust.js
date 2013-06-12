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
    "raptor/packaging/Dependency_dust",
    "raptor/packaging/Dependency",
    function(require, exports, module) {
        "use strict";
                
        var Dependency_dust = function() {
            Dependency_dust.superclass.constructor.apply(this, arguments);
            this.addProperty("path", {
                type: "string"
            });
        };
        
        Dependency_dust.prototype = {
            getKey: function(context) {
                return "dust:" + this.resolvePathKey(this.path, context);
            },
            
            toString: function() {
                return this.getResource().getPath();
            },
            
            getCode: function(context) {
                var dust;
                
                try
                {
                    dust = require('dustjs-linkedin');
                }
                catch(e) {
                    dust = require('dust');
                }
                
                var resource = this.getResource(context);
                var name = this.name;
                if (!name) {
                     name = resource.getPath();
                     if (name.endsWith('.dust')) {
                        name = name.slice(0, -5);
                     }
                }
                
                var compiled = dust.compile(resource.readAsString(), name);
                return compiled;
            },
           
            getResourcePath: function() {
                return this.path;
            },
            
            getContentType: function() {
                return "application/javascript";
            },
            
            isCompiled: function() {
                return true;
            },
            
            load: function(context) {
                var compiled = this.getCode(context);
                dust.loadSource(compiled);
            }
            
        };
        
        return Dependency_dust;
    });
