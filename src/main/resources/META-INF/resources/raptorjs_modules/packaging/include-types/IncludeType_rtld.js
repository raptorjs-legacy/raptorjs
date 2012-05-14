raptor.defineClass(
    "packaging.include-types.IncludeType_rtld",
    function() {
        return {
            load: function(include, manifest) {
                
                if (include.uri) {
                    raptor.require("templating.compiler").loadTaglibPackage(include.uri);
                }
                else if (include.path) {
                    //console.log('load_taglib: Loading taglib at path "' + include.path + '"...');
                    
                    
                    var taglibResource = manifest.resolveResource(include.path);
                    if (!taglibResource.exists()) {
                        raptor.throwError(new Error('Taglib with path "' + include.path + '" not found in package at path "' + manifest.getPackageResource().getSystemPath() + '"'));
                    }
                    //console.log('load_taglib: taglibResource "' + taglibResource.getSystemPath() + '"');
                    
                    raptor.require("templating.compiler").loadTaglibXml(taglibResource.readFully(), taglibResource.getSystemPath());
                }
                else {
                    var stringify = raptor.require('json.stringify').stringify;
                    raptor.throwError(new Error('Invalid taglib include of ' + stringify(include) + '" found in package at path "' + manifest.getPackageResource().getSystemPath() + '"'));
                }
            },
            
            aggregate: function(include, manifest, aggregator) {
                
                if (include.uri) {
                    if (aggregator.isIncludeDependenciesEnabled()) {
                        var taglibInfo = raptor.require("templating.compiler")._getTaglibInfo(include.uri);
                        aggregator.aggregatePackage(taglibInfo.path);
                    }
                }
                else if (include.path) {
                    var taglibResource = manifest.resolveResource(include.path);
                    if (!taglibResource.exists()) {
                        raptor.throwError(new Error('Taglib with path "' + include.path + '" not found in package at path "' + manifest.getPackageResource().getSystemPath() + '"'));
                    }
                    
                    var taglibJS = raptor.require("templating.compiler").compileTaglib(taglibResource.readFully(), taglibResource.getSystemPath());
                    aggregator.addJavaScriptCode(taglibJS, taglibResource.getSystemPath());
                }
                else {
                    var stringify = raptor.require('json.stringify').stringify;
                    raptor.throwError(new Error('Invalid taglib include of ' + stringify(include) + '" found in package at path "' + manifest.getPackageResource().getSystemPath() + '"'));
                }
            }
        };
    });
