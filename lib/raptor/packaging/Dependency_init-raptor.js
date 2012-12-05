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

raptor.define(
    "packaging.Dependency_init-raptor",
    "packaging.Dependency",
    function(raptor) {
        "use strict";
        
        var loaded = {},
            runtime = raptor.require('runtime');
        
        var Dependency_init_raptor = function() {
            Dependency_init_raptor.superclass.constructor.apply(this, arguments);

            this.addProperty("config", {
                type: "object"
            });
        };
        
        Dependency_init_raptor.prototype = {
            getKey: function() {
                return "init-raptor";
            },
            
            toString: function() {
                return "[init-raptor]";
            },
            
            load: function(context) {
                $rcreate(this.config);
            },
            
            getContentType: function() {
                return "application/javascript";
            },
            
            getCode: function(context) {
                var config = this.config || context.raptorConfig || {};
                return "$rcreate(" + (typeof config === 'string' ? config : JSON.stringify(config)) + ");";
            }
        };
        
        return Dependency_init_raptor;
    });
