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
        this.requires = [];
        this.requiresLookup = {};
    };
    
    PackageAggregator.prototype = {
        /**
         * 
         * @param resourcePath {String|packaging-PackageManifest}
         */
        aggregatePackage: function(manifest) {
            var options = this.options;
            
            var path = manifest.getPackageResource().getSystemPath(),
                enabledExtensions = options.enabledExtensions;
            
            
            if (this._included[path] === true) {
                return;
            }
            
            this._included[path] = true;
            
            manifest.forEachInclude({
                callback: function(type, include) {
                    this.handleInclude(include, manifest);
                },
                enabledExtensions: options.enabledExtensions,
                thisObj: this
            });
        },
        
        handleInclude: function(include, manifest) {
            var type = include.type;
            
            
            var handler = packaging.getIncludeHandler(type);
            
            if (!handler) {
                raptor.errors.throwError(new Error('Handler not found for include of type "' + include.type + '". Include: ' + JSON.stringify(include)));
            }
            else {
                var key = handler.includeKey(include);
                
                if (!this._included[key])
                {
                    this._included[key] = true;
                    var aggregateFunc = handler.aggregate;
                    if (!aggregateFunc) {
                        raptor.errors.throwError(new Error('"aggregate" function not found for include handler of type "' + include.type + '". Include: ' + JSON.stringify(include)));
                    }
                    aggregateFunc.call(handler, include, manifest, this);
                }
            }
        },
        
        addStyleSheetCode: function(css, path) {
            this.css.push({code: css, path: path});
        },

        addJavaScriptCode: function(js, path) {
            this.js.push({code: js, path: path});
        },

        addRequires: function(include) {
            var key = packaging.getIncludeHandler(type).includeKey(include);
            
            if (this.requiresLookup[key] !== true) {
                this.requiresLookup[key] = true;
                this.requires.push(include);
            }
        },
        
        forEachRequires: function(callback, thisObj) {
            forEach(this.requires, callback, thisObj);
        },
        
        isAlreadyIncluded: function(include) {
            return this._included[packaging.getIncludeHandler(include.type).includeKey(include)] === true;
        },
        
        setAlreadyIncluded: function(include) {
            this._included[packaging.getIncludeHandler(include.type).includeKey(include)] = true;
        },
        
        hasJavaScript: function() {
            return this.js.length !== 0;
        },
        
        hasStyleSheet: function() {
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
            this.addCode(contentType, resource.readFully(), resource.getSystemPath());
        }
    };
    
    PackageAggregator.aggregators = aggregators = {
    };
    
    packaging.PackageAggregator = PackageAggregator;
});

