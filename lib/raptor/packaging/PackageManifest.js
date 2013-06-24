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

    function DependencyError() {
        Error.apply(this, arguments);
    }

    DependencyError.prototype = new Error();

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
            
            var DependencyClass;

            try
            {
                DependencyClass = require('raptor/packaging').getDependencyClass(dependencyConfig.type);
            }
            catch(e) {
                if (e.dependencyError) {
                    throw e;
                }
                else {
                    var newError = raptor.createError(new Error('Unable to load dependency "' + JSON.stringify(dependencyConfig) + '" in "' + manifest.getURL() + '". Exception: ' + e), e);
                    newError.dependencyError = e;
                    throw newError;
                }
                
            }
            
            delete dependencyConfig.toString;
            
            var dependency = new DependencyClass();
            
            raptor.extend(dependency, dependencyConfig);
            
            if (manifest) {
                dependency.setParentManifest(manifest);
            }

            return dependency;
        };
   
    /**
     * Perform an in-place replacement of glob patterns with glob instances.
     * A glob is an instance of Minimatch.
     */
    function convertGlobPatternsToGlobs(patterns, cache, minimatch) {
        for (var i = 0; i < patterns.length; i++) {
            var globPattern = patterns[i],
                mm = cache.get(globPattern);
            if (!mm) {
                mm = new minimatch.Minimatch(globPattern);
                cache.put(globPattern, mm);
            }

            patterns[i] = mm;
        }
    }

    function addDependency(dependency, target, manifest) {

        if (dependency.type === 'glob') {

            if (dependency.include !== undefined) {

                var minimatch = require('minimatch');
                var cache = require('raptor/caching').getDefaultProvider().getCache('glob');

                // always work with arrays for convenience
                var includes = Array.isArray(dependency.include) ? dependency.include : [dependency.include],
                    excludes;

                convertGlobPatternsToGlobs(includes, cache, minimatch)

                if (dependency.exclude) {
                    excludes = Array.isArray(dependency.exclude) ? dependency.exclude : [dependency.exclude];
                    convertGlobPatternsToGlobs(excludes, cache, minimatch)
                }
                
                manifest.getDirectoryResource().forEachChild(function(childResource) {
                    var name = childResource.getName();
                    if (name.endsWith('package.json')) {
                        // Always skip package.json files
                        return;
                    }

                    if (excludes) {
                        for (var i = 0; i < excludes.length; i++) {
                            if (excludes[i].match(name)) {
                                return;
                            }
                        }
                    }

                    var match = false;
                    for (var i = 0; i < includes.length; i++) {
                        if (includes[i].match(name)) {
                            match = true;
                            break;
                        }
                    }

                    if (!match) {
                        return;
                    }

                    var dependency = {
                        path: name
                    };

                    // The file resource is part of the package
                    target.push(createDependency(name, manifest));
                });
            }

            return;

        } else if (typeof dependency === 'object') {
            var includePattern = dependency['include-pattern'];
            var excludePattern = dependency['exclude-pattern'];
            var extensionPattern = dependency['extension-pattern'];

            if (includePattern || excludePattern) {
                if (includePattern) {
                    includePattern = new RegExp(includePattern);
                }
                
                if (excludePattern) {
                    excludePattern = new RegExp(excludePattern);
                }

                if (extensionPattern) {
                    extensionPattern = new RegExp(extensionPattern);
                }

                // The dependency is file pattern that will
                // potentially match multiple dependencies
                var dirResource = manifest.getDirectoryResource();
                dirResource.forEachChild(function(childResource) {
                    if (!childResource.isFile()) {
                        return;
                    }
                    
                    var name = childResource.getName();
                    if (name.endsWith('package.json')) {
                        // Always skip package.json files
                        return;
                    }

                    if (excludePattern && excludePattern.test(name)) {
                        // Skip the exclude file
                        return;
                    }

                    if (includePattern && !includePattern.test(name)) {
                        // The file does not match the include test
                        return;
                    }

                    var dependency = {
                        path: name
                    };

                    if (extensionPattern) {
                        // See if there is an extension embedded
                        // within the filename
                        var matches = name.match(extensionPattern);
                        if (matches && matches.length > 1) {
                            dependency.extension = matches[1];
                        }
                    }

                    // The file resource is part of the package
                    target.push(createDependency(name, manifest));
                });


                return;
            }
        }

        target.push(createDependency(dependency, manifest));
    }

    var PackageManifest = function() {
        this.dependencies = [];
        this.extensions = [];
        this.packageResource = null;
        this._isPackageManifest = true;
        this.searchPathEntry = null;
        this._dirResource = undefined;
    };

    PackageManifest.createDependency = createDependency;
    
    PackageManifest.prototype = {
        getDirectoryResource: function() {
            if (this._dirResource === undefined && this.packageResource) {
                if (this.packageResource.isDirectory()) {
                    this._dirResource = this.packageResource;
                }
                else {
                    this._dirResource = this.packageResource.getParent();
                }
            }
            return this._dirResource;
        },

        setPackageResource: function(packageResource) {
            this.packageResource = packageResource;
            this._dirResource = undefined;
        },

        getDependencies: function() {
            return this.dependencies || [];
        },
        
        getExtensions: function() {
            return this.extensions || [];
        },

        setDependencies: function(dependencies) {
            this.dependencies = [];

            if (!dependencies || dependencies.length === 0) {
                return;
            }
            
            forEach(dependencies, function(dependency, i) {
                addDependency(dependency, this.dependencies, this);
            }, this);
        },
        
        getKey: function() {
            if (this.packageResource) {
                return this.packageResource.getURL();
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
                var outputDependencies = [];
                var dependencies = extension.dependencies || extension.includes;
                forEach(dependencies, function(dependency, i) {
                    addDependency(dependency, outputDependencies, this);
                }, this);
                
                if (extension.condition) {
                    extension.condition = eval("(function(extensions) { return " + extension.condition + ";})");
                }
                extension.dependencies = outputDependencies;
            }, this);
            
            
        },
        
        addDependency: function(dependencyDef) {
            addDependency(dependencyDef, this.dependencies, this);
        },
        
        /**
         *
         */
        getPackageResource: function() {
            return this.packageResource;
        },
        
        getURL: function() {
            return this.packageResource ? this.packageResource.getURL() : null;
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