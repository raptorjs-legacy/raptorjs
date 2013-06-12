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
    "raptor/packaging/Dependency_css",
    "raptor/packaging/Dependency",
    function(require, exports, module) {
        "use strict";
        
        var Dependency_css = function() {
            Dependency_css.superclass.constructor.apply(this, arguments);
            this.addProperty("path", {
                type: "string"
            });
        };
        
        Dependency_css.prototype = {
            
            getKey: function(context) {
                if (this.code){
                    return this.code;
                }
                return this.url || this.resolvePathKey(this.path, context);
            },
            
            toString: function() {
                return this.url || this.getResource().getPath();
            },
            
            getCode: function(context) {
                if (this.code){
                    return this.code;
                }
                return this.url ? null : this.getResource(context).readAsString("UTF-8");
            },
            
            getResourcePath: function() {
                return this.url ? null : this.path;
            },
            
            getContentType: function() {
                return "text/css";
            },
            
            isInPlaceDeploymentAllowed: function() {
                return true;
            },

            isExternalResource: function() {
                return this.url != null;
            },

            getUrl: function() {
                return this.url;
            }
        };
        
        return Dependency_css;
    });
