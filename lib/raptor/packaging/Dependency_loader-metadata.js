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
    "raptor/packaging/Dependency_loader-metadata",
    "raptor/packaging/Dependency",
    function(require, exports, module) {
        "use strict";
        
        var Dependency_loader_metadata = function() {
            Dependency_loader_metadata.superclass.constructor.apply(this, arguments);
        };
        
        Dependency_loader_metadata.prototype = {
            
            getKey: function() {
                return "loader-metadata";
            },
            
            toString: function() {
                return "[loader-metadata]";
            },
            
            getCode: function(context) {
                if (!context) {
                    throw new Error('context argument is required');
                }

                var loaderMetadata = context && context.loaderMetadata;
                if (loaderMetadata) {
                    return "$rset('loaderMeta'," + JSON.stringify(loaderMetadata) + ");";
                }
            },
            
            getResourcePath: function() {
                return null;
            },
            
            getContentType: function() {
                return "application/javascript";
            }
        };

        return Dependency_loader_metadata;
    });
