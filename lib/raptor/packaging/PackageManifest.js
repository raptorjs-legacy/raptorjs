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

define("raptor/packaging/PackageManifest", ['raptor'], function(raptor, require, exports, module) {
    "use strict";
    
    /**
     * @parent packaging_Server
     */
    
    var forEach = raptor.forEach,
        forEachEntry = raptor.forEachEntry,
        ExtensionCollection = require('raptor/packaging/ExtensionCollection'),
        nextId = 0;

    var createDependency = function(dependencyConfig, manifest) {
            
            if (dependencyConfig.__dependency) {
                return dependencyConfig;
            }
            
            var lastDot,
                path;
                
            if (typeof dependencyConfig === 'string') {
                path = dependencyConfig;
                lastDot = path.lastIndexOf('.');
                if (lastDot !== -1) {
                    dependencyConfig = {
                            path: dependencyConfig
                        };    
                }
                else {
                    dependencyConfig = {
                            type: "module",
                            name: path
                        };
                }
                
            }
            
            
            if (!dependencyConfig.type) {
                path = dependencyConfig.path;
                if (path) {
                    lastDot = path.lastIndexOf('.');
                    if (lastDot !== -1) {
                        dependencyConfig.type = path.substring(lastDot+1);
                    }
                }
                else {
                    if (dependencyConfig.hasOwnProperty('module')) {
                        dependencyConfig.type = "module";
                        dependencyConfig.name = dependencyConfig.module;
                        delete dependencyConfig.module;
                    }
                    else if (dependencyConfig.hasOwnProperty('package')) {
                        dependencyConfig.type = "package";
                        dependencyConfig.path = dependencyConfig['package'];
                        delete dependencyConfig['package'];
                    }
                }
            }
            
            var DependencyClass = require('raptor/packaging').getDependencyClass(dependencyConfig.type);

            var dependency = new DependencyClass();
            
            raptor.extend(dependency, dependencyConfig);
            
            if (manifest) {
                dependency.setParentManifest(manifest);
            }

            return dependency;
        };
   
    var PackageManifest = function() {
        this.dependencies = [];
        this.extensions = [];
        this.packageResource = null;
        this._isPackageManifest = true;
        this.searchPathEntry = null;
    };

    PackageManifest.createDependency = createDependency;
    
    PackageManifest.prototype = {
        
        setPackageResource: function(packageResource) {
            this.packageResource = packageResource;
        },

        getDependencies: function() {
            return this.dependencies || [];
        },
        
        getExtensions: function() {
            return this.extensions || [];
        },

        setDependencies: function(dependencies) {
            if (!dependencies || dependencies.length === 0) {
                this.dependencies = [];
                return;
            }
            
            forEach(dependencies, function(dependency, i) {
                dependencies[i] = createDependency(dependency, this); 
            }, this);
            this.dependencies = dependencies;
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
            
            if (!Array.isArray(extensions)) {
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
                var dependencies = extension.dependencies || extension.includes;
                forEach(dependencies, function(dependency, i) {
                    dependencies[i] = createDependency(dependency, this);
                }, this);
                
                if (extension.condition) {
                    extension.condition = eval("(function(extensions) { return " + extension.condition + ";})");
                }
                extension.dependencies = dependencies;
            }, this);
            
            
        },
        
        addDependency: function(dependencyDef) {
            this.dependencies.push(createDependency(dependencyDef, this));
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
         * @returns {raptor/resources/SearchPathEntry} The search path entry where the package.json resource was found.
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

        setName: function(name) {
            this.name = name;
        },
        
        /**
         */
        toString: function() {
            return '[Package manifest: ' + this.getName() + ']';
        },
        
        resolveResource: function(relPath) {
            var resource = require('raptor/resources').resolveResource(this.getPackageResource(), relPath);
            return resource;
        },
        
        load: function() {
            require('raptor/packaging').load(this);
        },
        
        getRaptorProp: function(name) {
            var raptorObj = this.raptor;
            return raptorObj ? raptorObj[name] : null;
        },
        
        /**
         * 
         * @param options
         * @returns
         */
        forEachDependency: function(options) {
             
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
                enabledExtensions = require('raptor/packaging').getEnabledExtensions();
            }
            else {
                if (!(enabledExtensions instanceof ExtensionCollection)) {
                    enabledExtensions = new ExtensionCollection(enabledExtensions);
                }
            }

            var dependencyFilter = options.dependencyFilter,
                callback = options.callback,
                thisObj = options.thisObj,
                _isExtensionDependencyd = function(extensionName) {
                    if (enabledExtensions) {
                        var extensionParts = extensionName.split(/[_\-,|]/),
                            i=0,
                            len = extensionParts.length;
                        for (; i<len; i++) {
                            if (extensionParts[i] === '') {
                                continue; //Dependency extensions with an empty string
                            }
                            
                            if (!enabledExtensions.contains(extensionParts[i])) {
                                return false; //Skip this extension if it is filtered out
                            }
                        }
                    }
                    return true;
                };
            
            
            var _handleDependencies = function(dependencies, extension) {
                forEach(dependencies, function(dependency) {
                    
                    if (dependency.extension && !_isExtensionDependencyd(dependency.extension)) {
                        return;
                    }
                    
                    if (dependencyFilter && !dependencyFilter.call(thisObj, dependency.type, dependency)) {
                        return;
                    }
                       
                    callback.call(thisObj, dependency.type, dependency, extension);
                });
            };
            
            if (this.dependencies) {
                _handleDependencies(this.dependencies, null); //Only process the regular dependencies if they are not filtered out
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
                    else if (!_isExtensionDependencyd(extensionName)) {
                        return;
                    }
                    
                    _handleDependencies(extensionDef.dependencies, extensionName);

                }, this);
            }
        }
    };
    
    return PackageManifest;
});