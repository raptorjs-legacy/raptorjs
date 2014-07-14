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


var removeDefPrefix = '(function(){var define=undefined;';
var removeDefSuffix = '}());';

var namedDefPrefix = '(function(){var define=$rdef(';
var namedDefSuffix = '}());';

define.Class(
    "raptor/packaging/Dependency_define",
    "raptor/packaging/Dependency",
    function(require, exports, module) {
        "use strict";


        
        var Dependency_define = function() {
            Dependency_define.superclass.constructor.apply(this, arguments);
            this.addProperty("path", {
                type: "string"
            });

            this.addProperty("name", {
                type: "string"
            });
        };
        
        Dependency_define.prototype = {
            
            getKey: function(context) {

                console.log('GET KEY: ', this);
                if (this.code){
                    return 'def|' + this.code + '|' + this.name;
                }
                return 'def|' + this.resolvePathKey(this.path, context) + '|' + this.name;
            },
            
            toString: function() {
                return this.getResource().getPath();
            },
            
            getCode: function(context) {
                var code = this.code || this.getResource(context).readAsString("UTF-8");

                var defineName = this.name;
                if (defineName) {
                    code = namedDefPrefix + JSON.stringify(this.name) + ');' + code + namedDefSuffix;
                } else {
                    code = removeDefPrefix + code + removeDefSuffix;
                }

                return code;
            },
            
            getResourcePath: function() {
                return this.path;
            },
            
            getContentType: function() {
                return "application/javascript";
            },
            
            isInPlaceDeploymentAllowed: function() {
                return false;
            },

            isExternalResource: function() {
                return false;
            },

            getUrl: function() {
                return null;
            }
        };
        
        return Dependency_define;        
    });