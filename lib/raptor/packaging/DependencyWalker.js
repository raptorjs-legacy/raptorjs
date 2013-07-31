define('raptor/packaging/DependencyWalker', function(require, module, exports) {
    var extend = require('raptor').extend,
        packaging = require('raptor/packaging')
        PackageManifest = require('raptor/packaging/PackageManifest'),
        ExtensionCollection = require('raptor/packaging/ExtensionCollection');

    function DependencyWalker() {
        this.options = {
            enabledExtensions: require('raptor/packaging').getEnabledExtensions()
        };

        this._visited = {};
        this._userDependencyHandler = undefined;
        this._userManifestHandler = undefined;
        this._completeHandler = undefined;
        this._errorHandler = undefined;
        this._ready = false;
        this._manifestQueue = [];

        this._dependencyHandler = function(type, dependency, extension) {
            if (this._userDependencyHandler) {
                this._userDependencyHandler(dependency, extension);
            }
        };
    }

    DependencyWalker.prototype = {

        _notifyError: function(err) {
            if (this.errorHandler) {
                this.errorHandler(err);
            } else {
                throw err;
            }
        },

        onComplete: function(completeHandler) {
            this._completeHandler = completeHandler;
            return this;
        },

        onError: function(errorHandler) {
            this._errorHandler = errorHandler;
            return this;
        },

        onDependency: function(dependencyHandler) {
            this._userDependencyHandler = dependencyHandler;
            return this;
        },

        onManifest: function(manifestHandler) {
            this._userManifestHandler = manifestHandler;
            return this;
        },

        enableExtensions: function(enabledExtensions) {
            if (enabledExtensions instanceof ExtensionCollection) {
                this.options.enabledExtensions = enabledExtensions;
            } else {
                this.options.enabledExtensions = new ExtensionCollection(enabledExtensions);
            }
            return this;
        },

        walkManifest: function(packageManifest) {
            if (!this._ready) {
                this._manifestQueue.push(packageManifest);
                return;
            }

            var dependency = undefined,
                key;
            if (!PackageManifest.isPackageManifest(packageManifest)) {
                dependency = packageManifest;

                var resource = this.getResource(dependency);
                if (resource) {
                    key = PackageManifest.getResourceKey(resource);
                    if (this._visited[key] !== undefined) {
                        // don't actually load the manifest if we know we've seen it before
                        return this;
                    }
                }
                packageManifest = this.getManifest(dependency);
            } else {
                key = packageManifest.getKey();
                if (this._visited[key] !== undefined) {
                    // we've visited this manifest before so skip it by returning early
                    return this;
                }
            }

            this._visited[key] = true;

            if (this._userManifestHandler) {
                this._userManifestHandler(packageManifest, dependency);
            }
            packageManifest.forEachDependency(this._dependencyHandler, this, this.options);
            return this;
        },

        walkPackage: function(packageName) {
            try {
                this.walkManifest(packaging.getPackageManifest(packageName));
            } catch(err) {
                this._notifyError(err);
            }
            return this;
        },

        walkModule: function(moduleName) {
            try {
                this.walkManifest(packaging.getModuleManifest(moduleName));
            } catch(err) {
                this._notifyError(err);
            }
            return this;
        },

        isPackage: function(dependencyConfig) {
            return (dependencyConfig.type === 'package');
        },

        isModule: function(dependencyConfig) {
            return (dependencyConfig.type === 'module');
        },

        hasManifest: function(dependency) {
            return (dependency.isPackageDependency && dependency.isPackageDependency()) || this.isModule(dependency) || this.isPackage(dependency);
        },

        getResource: function(dependency) {
            var path;
            if (dependency.getResourcePath && (path = dependency.getResourcePath())) {
                return packaging.getPackageManifestResource(path);
            } else if (dependency.path) {
                return packaging.getPackageManifestResource(dependency.path);
            } else if (dependency.name) {
                return packaging.getPackageManifestResourceForModule(dependency.name);
            } else {
                return null;
            }
        },

        getManifest: function(dependency) {
            if (dependency.getManifest) {
                return dependency.getManifest();
            } else if (this.isModule(dependency)) {
                packaging.getModuleManifest(dependency.name);
            } else if (this.isPackage(dependency)) {
                packaging.getPackageManifest(dependency.path);
            } else {
                this._notifyError(new Error('Dependency "' + dependency + '" does not have a package manifest.'));
            }
        },

        start: function() {
            this._ready = true;
            var queue = this._manifestQueue;
            for (var i = 0, len = queue.length; i < len; i++) {
                this.walkManifest(queue[i]);
            }

            if (this._completeHandler) {
                this._completeHandler();
            }
        }
    };

    return DependencyWalker;

});