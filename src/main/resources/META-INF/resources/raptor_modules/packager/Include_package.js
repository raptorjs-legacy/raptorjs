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

raptor.defineClass(
    "packager.Include_package",
    "packager.Include",
    function(raptor) {
        "use strict";
        
        return {
            getKey: function() {
                return "package:" + this.path;
            },
            
            toString: function() {
                return "[package: " + this.path + "]";
            },
            
            load: function(context) {
                if (!this.path) {
                    console.error("Invalid package include: ", this);
                    raptor.throwError("Invalid package include");
                }
                raptor.packager.load(this.path);
            },

            getManifest: function() {
                var manifest = raptor.packager.getPackageManifest(this.path);
                if (!manifest) {
                    raptor.throwError(new Error('Package manifest not found at path "' + this.path + '"'));    
                }
                return manifest;
            },
            
            isPackageInclude: function() {
                return true;
            }
        };
    });


