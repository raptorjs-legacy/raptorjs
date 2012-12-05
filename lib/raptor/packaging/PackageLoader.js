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

$rload(function(raptor) {
    "use strict";
    
    var packaging = raptor.packaging,
        runtime = raptor.runtime,
        loaded = {};
    
    var PackageLoader = function() {
        this._loaded = {};
    };
    
    PackageLoader.prototype = {
        /**
         * 
         * @param resourcePath {String|packaging-PackageManifest}
         */
        load: function(resourcePath, options) {
            var manifest = resourcePath._isPackageManifest ? 
                    resourcePath :
                    packaging.getPackageManifest(resourcePath),
                path = manifest.getPackageResource().getSystemPath(),
                enabledExtensions = options.enabledExtensions;
            
            
            if (loaded[path] === true) {
                return;
            }
            
            loaded[path] = true;
            
            manifest.forEachDependency({
                callback: function(type, dependency) {
                    if (dependency.isPackageDependency()) {
                        dependency.load(this);
                    }
                    else {
                        var contentType = dependency.getContentType();
                        if (contentType === 'application/javascript') {
                            dependency.load(this);
                        }    
                    }
                    
                },
                enabledExtensions: enabledExtensions,
                thisObj: this
            });
        },
        
        setLoaded: function(path) {
            this._loaded[path] = true;
        },
        
        isLoaded: function(path) {
            return this._loaded[path] === true;
        }
    };
    
    packaging.PackageLoader = PackageLoader;
    
    packaging.PackageLoader.instance = new PackageLoader();
});

