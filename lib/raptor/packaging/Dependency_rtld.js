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
    "raptor/packaging/Dependency_rtld",
    "raptor/packaging/Dependency_resource",
    ['raptor'],
    function(require, exports, module) {
        "use strict";

        var Dependency_rtld = function() {
            Dependency_rtld.superclass.constructor.apply(this, arguments);
            
            this.addProperty("path", {
                type: "string"
            });
        };
        
        Dependency_rtld.prototype = {
            
            invalidDependency: function() {
                throw raptor.createError(new Error('Invalid taglib dependency of "rtld" found in package at path "' + this.getParentManifestSystemPath() + '"'));
            },
            
            getKey: function(context) {
                if (this.path) {
                    return "rtld:" + this.resolvePathKey(this.path, context);
                }
                else {
                    this.invalidDependency();
                }
            },

            getContentType: function() {
                return "application/javascript";
            },
            
            getResourcePath: function() {
                return this.path;
            },
            
            getCode: function(context) {
                
                var resourceCode = Dependency_rtld.superclass.getCode.apply(this, arguments);
                var taglibResource = this.getResource(context);
                return resourceCode + '$radd("rtld","' + taglibResource.getPath() + '");';
            },
            
            isCompiled: function() {
                return true;
            }
        };
        
        return Dependency_rtld;
    });
