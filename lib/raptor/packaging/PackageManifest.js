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
        nextId = 0,
        _packaging;

    function DependencyError() {
        Error.apply(this, arguments);
    }

    DependencyError.prototype = new Error();

    // This method is necessary so that we can correctly infer the type of dependency represented by
    // a path such as "SomeFile.i18n.json".
    // In this example, this allows both "i18n.json" and "json" to be registered types.
    var inferDependencyTypeFromPath = function(dependencyConfig, packaging) {
        // Find the type from the longest matching file extension.
        // For example if we are trying to infer the type of "jquery-1.8.3.js" then we will try:
        // a) "8.3.js"
        // b) "3.js"
        // c) "js"
        var path = dependencyConfig.path,
            lastSlash = path.lastIndexOf('/'),
            dotPos;

        if (lastSlash === -1) {
            // there is no slash in the path so we can use the first dot position
            dotPos = path.indexOf('.');
        } else {
            // there is a slash in the path so use the first dot position after the slash
            dotPos = path.indexOf('.', lastSlash+1);
        }
        if (dotPos === -1) {
            // assume dependency is a module since the path does not have a fileextension
            dependencyConfig.type = 'module';
            dependencyConfig.name = path;
            return;
        }

        var type;
        do {
            var type = path.substring(dotPos + 1);
            if (packaging.isKnownDependencyType(type)) {
                dependencyConfig.type = type;
                return;
            }
            // move to the next dot position
            dotPos = path.indexOf('.', dotPos+1);
        } while(dotPos !== -1);
    }

    var normalizeDependencyConfig = function(dependencyConfig) {
        // Cache reference to packaging module the first time we reference it
        var packaging = _packaging || (_packaging = require('raptor/packaging'));

        if (typeof dependencyConfig === 'string') {
            dependencyConfig = {
                path: dependencyConfig
            };
        }
        
        if (!dependencyConfig.type) {
            // the dependency doesn't have a type so try to infer it from the path
            if (dependencyConfig.path) {
                inferDependencyTypeFromPath(dependencyConfig, packaging);
            }
            else if (dependencyConfig.hasOwnProperty('module')) {
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
        return dependencyConfig;
    }

    var createDependency = function(dependencyConfig, manifest) {
            
            if (dependencyConfig.__dependency) {
                // dependency config is already an instance of Dependency
                return dependencyConfig;
            }
            
            // The dependency configuration allows variations for defining equivalent dependencies so
            // we need to normalize those variations
            dependencyConfig = normalizeDependencyConfig(dependencyConfig);

            // Cache reference to packaging module the first time we reference it
            var packaging = _packaging || (_packaging = require('raptor/packaging'));
            
            var DependencyClass = packaging.getDependencyClass(dependencyConfig.type);
            if (!DependencyClass) {
                throw raptor.createError(new Error('Unable to load dependency "' + JSON.stringify(dependencyConfig) + '"' + (manifest ? ' in "' + manifest.getURL() + '"' : '') + '. Dependency class not found for dependency of type "' + dependencyConfig.type + '"'));
            }
            
            delete dependencyConfig.toString;
            
            var dependency = new DependencyClass();
            
            raptor.extend(dependency, dependencyConfig);
            
            if (manifest) {
                dependency.setParentManifest(manifest);
            }

            // give the dependence a chance to do some post-construction initialization
            if (dependency.initialize) {
                dependency.initialize();
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

                convertGlobPatternsToGlobs(includes, cache, minimatch);

                if (dependency.exclude) {
                    excludes = Array.isArray(dependency.exclude) ? dependency.exclude : [dependency.exclude];
                    convertGlobPatternsToGlobs(excludes, cache, minimatch);
                }
                
                manifest.getDirectoryResource().forEachChild(function(childResource) {
                    var name = childResource.getName();
                    var i;

                    if (name.endsWith('package.json')) {
                        // Always skip package.json files
                        return;
                    }

                    if (excludes) {
                        for (i = 0; i < excludes.length; i++) {
                            if (excludes[i].match(name)) {
                                return;
                            }
                        }
                    }

                    var match = false;
                    for (i = 0; i < includes.length; i++) {
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
    PackageManifest.normalizeDependencyConfig = normalizeDependencyConfig;
    PackageManifest.isPackageManifest = function(packageManifest) {
        return packageManifest._isPackageManifest;
    }
    PackageManifest.getResourceKey = function(resource) {
        return resource.getURL();
    }
    
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
                return PackageManifest.getResourceKey(this.packageResource);
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
                _isExtensionDependency = function(extensionName) {
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

                    if (dependency.extension && !_isExtensionDependency(dependency.extension)) {
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
                    else if (!_isExtensionDependency(extensionName)) {
                        return;
                    }
                    
                    _handleDependencies(extensionDef.dependencies, extensionName);

                }, this);
            }
        }
    };
    
    return PackageManifest;
});