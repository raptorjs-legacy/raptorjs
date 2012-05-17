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
    /**
     * @parent packaging_Server
     */
    
    var arrays = raptor.arrays,
        objects = raptor.objects,
        strings = raptor.strings,
        errors = raptor.errors,
        forEach = raptor.forEach,
        forEachEntry = raptor.forEachEntry,
        ExtensionCollection = raptor.packaging.ExtensionCollection;

    var PackageManifest = {
        /**
         * 
         * @param packageDirPath
         * @returns
         */
        init: function(packageDirPath, packageResource) {
            this.packageDirPath = packageDirPath;
            this.packageResource = packageResource;
            this._isPackageManifest = true;
            
            if (this.extensions) {
                var extensions = [];
                
                if (!arrays.isArray(this.extensions)) {
                    //Convert the extensions to an ordered array
                    forEachEntry(this.extensions, function(name, extDef) {
                        extDef.name = name;
                        extensions.push(extDef);
                    });
                    this.extensions = extensions;
                    
                    this.extensions.sort(function(a,b) {
                        if (a === b) {
                            return 0;
                        }
                        else if (a == null) {
                            return -1;
                        }
                        else if (b == null) {
                            return 1;
                        }
                        else {
                            return a < b ? -1 : (a > b ? 1 : 0);
                        }
                    });
                }
                
                forEach(this.extensions, function(extDef) {
                    if (extDef.condition) {
                        extDef.condition = eval("(function(extensions) { return " + extDef.condition + ";})");
                    }
                });
            }
            
        },
        
        /**
         * 
         */
        getPackageResource: function() {
            return this.packageResource;
        },
        
        /**
         * Returns the search path entry where the package.json resource was found.
         * 
         * @returns {resources$SearchPathEntry} The search path entry where the package.json resource was found.
         */
        getSearchPathEntry: function() {
            return this.packageResource ? this.packageResource.getSearchPathEntry() : null;
        },
        
        /**
         * 
         * @returns
         */
        getName: function() {
            return this.name;
        },
        
        /**
         */
        toString: function() {
            return '[Module manifest: ' + this.getName() + ']';
        },
        
        /**
         * 
         * @returns
         */
        getDirPath: function() {
            return this.packageDirPath;
        },
        
        resolveResource: function(path) {
            if (!strings.startsWith(path, '/')) {
                path = this.getDirPath() + '/' + path;
            }
            
            var resource = raptor.resources.findResource(path, this.getSearchPathEntry() /* Search within the same search path entry */);
            if (resource.exists() === false) {
                errors.throwError(new Error('Resource "' + path + '" not found for package "' + this.getPackageResource().getSystemPath()));
            }
            
            return resource;
        },
        
        /**
         * 
         * @param options
         * @returns
         */
        forEachInclude: function(options) {
            if (!options) {
                options = {};
            }
            var enabledExtensions = options.enabledExtensions;
            if (enabledExtensions) {
                enabledExtensions = new ExtensionCollection(enabledExtensions);
            }
            
            var includeFilter = options.includeFilter,
                callback = options.callback,
                thisObj = options.thisObj,
                _isExtensionIncluded = function(extensionName) {
                    if (enabledExtensions) {
                        var extensionParts = extensionName.split(/[_\-,|]/),
                            i=0,
                            len = extensionParts.length;
                        for (; i<len; i++) {
                            if (extensionParts[i] === '') {
                                continue; //Include extensions with an empty string
                            }
                            
                            if (!enabledExtensions.contains(extensionParts[i])) {
                                return false; //Skip this extension if it is filtered out
                            }
                        }
                    }
                    return true;
                };
            
            
            var _handleIncludes = function(includes, extension) {
                arrays.forEach(includes, function(include) {
                    if (include.extension && !_isExtensionIncluded(include.extension)) {
                        return;
                    }
                    
                    if (includeFilter && !includeFilter.call(thisObj, include.type, include)) {
                        return;
                    }
                    
                    callback.call(thisObj, include.type, include, extension);
                }, this);
            };
            
            if (this.includes) {
                _handleIncludes(this.includes, null, null); //Only process the regular includes if they are not filtered out
            }
            
            if (this.extensions) {
                
                arrays.forEach(this.extensions, function(extensionDef) {
                    var extensionName = extensionDef.name;
                    
                    if (extensionDef.condition)
                    {
                        if (!enabledExtensions) {
                            enabledExtensions = new ExtensionCollection();
                        }
                        
                        if (!extensionDef.condition(enabledExtensions)) {
                            return;
                        }
                    }
                    else if (!_isExtensionIncluded(extensionName)) {
                        return;
                    }
                    
                    _handleIncludes(extensionDef.includes, extensionName);

                }, this);
            }
        }
    };
    
    raptor.packaging.PackageManifest = PackageManifest;
});