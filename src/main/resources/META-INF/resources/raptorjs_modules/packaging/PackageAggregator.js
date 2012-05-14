raptorBuilder.addLoader(function(raptor) {
    var packaging = raptor.packaging,
        forEach = raptor.forEach,
        loaded = {},
        aggregators;
    
    var PackageAggregator = function(options) {
        this._included = {};
        this.js = [];
        this.css = [];
        this.options = options || {};
        this.includeDependencies = this.options.includeDependencies === true;
    };
    
    PackageAggregator.prototype = {
        /**
         * 
         * @param resourcePath {String|packaging-PackageManifest}
         */
        aggregatePackage: function(resourcePath) {
            var options = this.options;
            
            var manifest = resourcePath._isPackageManifest ? 
                    resourcePath :
                    packaging.getPackageManifest(resourcePath),
                path = manifest.getPackageResource().getSystemPath(),
                enabledExtensions = options.enabledExtensions;
            
            
            if (this._included[path] === true) {
                return;
            }
            
            this._included[path] = true;
            
            manifest.forEachInclude({
                callback: function(type, include) {
                    var handler = packaging.getIncludeHandler(type);
                    if (!handler) {
                        raptor.errors.throwError(new Error('Handler not found for include of type "' + include.type + '". Include: ' + JSON.stringify(include)));
                    }
                    else {
                        var aggregateFunc = handler.aggregate;
                        if (!aggregateFunc) {
                            raptor.errors.throwError(new Error('"aggregate" function not found for include handler of type "' + include.type + '". Include: ' + JSON.stringify(include)));
                        }
                        aggregateFunc.call(handler, include, manifest, this);
                    }
                },
                enabledExtensions: options.enabledExtensions,
                thisObj: this
            });
        },
        
        addStyleSheetCode: function(css, path) {
            this.css.push({code: css, path: path});
        },

        addJavaScriptCode: function(js, path) {
            this.js.push({code: js, path: path});
        },
        
        setIncluded: function(path) {
            this._included[path] = true;
        },
        
        isIncluded: function(path) {
            return this._included[path] === true;
        },
        
        hasJavaScriptCode: function() {
            return this.js.length !== 0;
        },
        
        hasStyleSheetCode: function() {
            return this.css.length !== 0;
        },
        
        forEachJavaScript: function(callback, thisObj) {
            forEach(this.js, callback, thisObj);
        },
        
        forEachStyleSheet: function(callback, thisObj) {
            forEach(this.css, callback, thisObj);
        },
        
        addCode: function(contentType, code, path) {
            if (contentType === 'css') {
                this.addStyleSheetCode(code, path);
            }
            else if (contentType === 'js') {
                this.addJavaScriptCode(code, path);
            }
        },
        
        addResourceCode: function(contentType, resource) {
            var path = resource.getSystemPath();
        
            if (!this.isIncluded(path)) {
                this.setIncluded(path);
                
                this.addCode(contentType, resource.readFully(), path);
            }
        },
        
        isIncludeDependenciesEnabled: function() {
            return this.includeDependencies;
        }
    };
    
    PackageAggregator.aggregators = aggregators = {
    };
    
    packaging.PackageAggregator = PackageAggregator;
});

