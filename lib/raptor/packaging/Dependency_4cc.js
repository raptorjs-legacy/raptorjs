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
    "raptor/packaging/Dependency_4cc",
    "raptor/packaging/Dependency",
    function(require, exports, module) {
        "use strict";
        
        var Dependency_4cc = function() {
            Dependency_4cc.superclass.constructor.apply(this, arguments);
            this.addProperty("path", {
                type: "string"
            });
        };
        
        Dependency_4cc.prototype = {
            getKey: function(context) {
                return "4cc:" + this.resolvePathKey(this.path, context);
            },
            
            toString: function() {
                return this.getResource().getPath();
            },
            
            getCode: function(context) {
                return this.getResource(context).readAsString("UTF-8");
            },
           
            getResourcePath: function() {
                return this.path;
            },
            
            getContentType: function() {
                return "application/content";
            },
            
            isInPlaceDeploymentAllowed: function() {
                return true;
            },
            
            load: function(context) {
            }
            
        };

        return Dependency_4cc;
    });
