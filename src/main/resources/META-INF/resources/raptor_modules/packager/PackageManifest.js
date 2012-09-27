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
    
    /**
     * @parent packager_Server
     */
    
    var forEach = raptor.forEach,
        forEachEntry = raptor.forEachEntry,
        packager = raptor.packager,
        ExtensionCollection = raptor.packager.ExtensionCollection,
        nextId = 0;

    var createInclude = function(includeConfig, manifest) {
            
            if (includeConfig.__include) {
                return includeConfig;
            }
            
            var lastDot,
                path;
                
            if (typeof includeConfig === 'string') {
                path = includeConfig;
                lastDot = path.lastIndexOf('.');
                if (lastDot !== -1) {
                    includeConfig = {
                            path: includeConfig
                        };    
                }
                else {
                    includeConfig = {
                            type: "module",
                            name: path
                        };
                }
                
            }
            
            
            if (!includeConfig.type) {
                path = includeConfig.path;
                if (path) {
                    lastDot = path.lastIndexOf('.');
                    if (lastDot !== -1) {
                        includeConfig.type = path.substring(lastDot+1);
                    }
                }
                else {
                    if (includeConfig.hasOwnProperty('module')) {
                        includeConfig.type = "module";
                        includeConfig.name = includeConfig.module;
                        delete includeConfig.module;
                    }
                    else if (includeConfig.hasOwnProperty('package')) {
                        includeConfig.type = "package";
                        includeConfig.path = includeConfig['package'];
                        delete includeConfig['package'];
                    }
                }
            }
            
            var IncludeClass = packager.getIncludeClass(includeConfig.type);

            var include = new IncludeClass();
            
            raptor.extend(include, includeConfig);
            
            if (manifest) {
                include.setParentManifest(manifest);
            }

            return include;
        };
   
    var PackageManifest = function() {
        this.includes = [];
        this.extensions = [];
        this.packageResource = null;
        this._isPackageManifest = true;
        this.searchPathEntry = null;
    };
    
    PackageManifest.prototype = {
        
        setPackageResource: function(packageResource) {
            this.packageResource = packageResource;
        },
            
        setIncludes: function(includes) {
            if (!includes || includes.length === 0) {
                this.includes = [];
                return;
            }
            
            forEach(includes, function(include, i) {
                includes[i] = createInclude(include, this); 
            }, this);
            this.includes = includes;
        },
        
        getKey: function() {
            if (this.packageResource) {
                return this.packageResource.getSystemPath();
            }
            else {
                return this.key || (this.key = nextId++);
            }
        },
        
        setExtensions: function(extensions) {
            
            if (!extensions || extensions.length === 0) {
                this.extensions = [];
                return;
            }
            
            if (!raptor.isArray(extensions)) {
                this.extensions = [];
                
                //Convert the extensions to an ordered array
                forEachEntry(extensions, function(name, extension) {
                    extension.name = name;
                    this.extensions.push(extension);
                }, this);
                
                this.extensions.sort(function(a,b) {
                    a = a.name;
                    b = b.name;
                    
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
            else {
                this.extensions = extensions;
            }
            
            forEach(this.extensions, function(extension) {
                forEach(extension.includes, function(include, i) {
                    extension.includes[i] = createInclude(include, this);
                }, this);
                
                if (extension.condition) {
                    extension.condition = eval("(function(extensions) { return " + extension.condition + ";})");
                }
            }, this);
            
            
        },
        
        addInclude: function(includeDef) {
            this.includes.push(createInclude(includeDef, this));
        },
        
        /**
         * 
         */
        getPackageResource: function() {
            return this.packageResource;
        },
        
        getSystemPath: function() {
            return this.packageResource ? this.packageResource.getSystemPath() : null;
        },
        
        getPath: function() {
            return this.packageResource.getPath();
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
        
        resolveResource: function(relPath) {
            var resource = raptor.require('resources').resolveResource(this.getPackageResource(), relPath);
            return resource;
        },
        
        load: function() {
            raptor.require('packager').load(this);
        },
        
        /**
         * 
         * @param options
         * @returns
         */
        forEachInclude: function(options) {
             
            if (typeof options === 'function') {
                options = {
                    callback: arguments[0],
                    thisObj: arguments[1]
                };
                
                if (arguments[2]) {
                    raptor.extend(options, arguments[2]);
                }
            }
            
            var _this = this;
            
            if (!options) {
                options = {};
            }
            var enabledExtensions = options.enabledExtensions;
            if (enabledExtensions === undefined) {
                enabledExtensions = raptor.require('packager').getEnabledExtensions();
            }
            else {
                if (!(enabledExtensions instanceof ExtensionCollection)) {
                    enabledExtensions = new ExtensionCollection(enabledExtensions);
                }
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
                forEach(includes, function(include) {
                    
                    if (include.extension && !_isExtensionIncluded(include.extension)) {
                        return;
                    }
                    
                    if (includeFilter && !includeFilter.call(thisObj, include.type, include)) {
                        return;
                    }
                       
                    callback.call(thisObj, include.type, include, extension);
                });
            };
            
            if (this.includes) {
                _handleIncludes(this.includes, null); //Only process the regular includes if they are not filtered out
            }
            
            if (this.extensions) {
                
                forEach(this.extensions, function(extensionDef) {
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
    
    raptor.packager.PackageManifest = PackageManifest; 
    raptor.packager.createInclude = createInclude;
});