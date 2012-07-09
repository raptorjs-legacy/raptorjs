raptor.define(
    "packager.bundler", 
    function(raptor) {
        
        var forEach = raptor.forEach,
            Bundle = raptor.require("packager.bundler.Bundle"),
            BundleMappings = raptor.require("packager.bundler.BundleMappings"),
            PageDependencies = raptor.require("packager.bundler.PageDependencies");
            
        return {

            createBundle: function(name) {
                return new Bundle(name);
            },
            
            createBundleMappings: function(bundles, options) {
                return new BundleMappings(bundles, options);
            },
            
            createPageDependencies: function(pageName, options) {
                return new PageDependencies(pageName, options);
            },
            
            forEachInclude: function(includes, enabledExtensions, callback, thisObj) {

                var handleInclude = function(include, recursive, depth) {
                    include = raptor.require('packager').createInclude(include);
                    
                    
                    
                    
                    
                    if (include.isPackageInclude()) {
                        var skip = callback.call(thisObj, include, recursive, depth);
                        if (skip === true) {
                            return;
                        }    
                        
                        
                        var dependencyManifest = include.getManifest();
                        
                        if (recursive === true || depth === 0) {
                            
                            dependencyManifest.forEachInclude(
                                function(type, packageInclude) {
                                    
                                    handleInclude.call(this, packageInclude, recursive, depth+1, dependencyManifest);
                                },
                                this,
                                {
                                    enabledExtensions: enabledExtensions
                                });
                        }
                    }
                    else {
                        callback.call(thisObj, include, recursive, depth)
                    }
                };
                
                forEach(includes, function(include) {
                    handleInclude.call(this, include, include.recursive === true, 0);
                }, this);
            }
        }
    });