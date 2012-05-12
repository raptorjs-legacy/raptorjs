/**
 * @extension Server
 */
raptor.extend(
    "templating.compiler",
    function(raptor, compiler) {
        var resources = raptor.require('resources'),
            strings = raptor.require('strings'),
            json = raptor.require('json'),
            packaging = raptor.require("packaging"),
            forEachEntry = raptor.forEachEntry,
            errors = raptor.errors,
            loadedTaglibs = {},
            registeredTaglibs = {},
            registerTaglib = function(uri, path, registryResource) {
                if (!strings.endsWith(path, "/package.json")) {
                    path += "/package.json";
                }
                registeredTaglibs[uri] = {
                        path: path,
                        searchPathEntry: registryResource.getSearchPathEntry(),
                        registryPath: registryResource.getSystemPath()
                };
            };
        
        packaging.enableExtension("templating.compiler");
        
        return {
            /**
             * 
             * @param path
             * @returns
             */
            compileResource: function(path) {
                var resource = resources.findResource(path);
                if (!resource.exists()) {
                    errors.throwError(new Error('Unable to compile template with resource path "' + path + '". Resource not found'));
                }
                var src = resource.readFully(src);
                return this.compile(src, resource.getSystemPath());
            },
            
            /**
             * 
             * @param path
             * @returns
             */
            compileAndLoadResource: function(path) {
                var resource = resources.findResource(path);
                if (!resource.exists()) {
                    errors.throwError(new Error('Unable to compile template with resource path "' + path + '". Resource not found'));
                }
                var src = resource.readFully(src);
                this.compileAndLoad(src, resource.getSystemPath());
            },
            
            /**
             * 
             * @returns
             */
            discoverTaglibs: function() {
                
                resources.findAllResources('/taglib-registry.json', function(registryResource) {
                    var taglibRegistry = json.parse(registryResource.readFully());
                    forEachEntry(taglibRegistry, function(uri, path) {
                        registerTaglib(uri, path, registryResource);
                    }, this);
                }, this);
                
                forEachEntry(registeredTaglibs, function(uri) {
                    
                    this.loadTaglib(uri);
                }, this);
            },
            
            /**
             * 
             * @param resource
             * @returns
             */
            loadTaglib: function(uri) {
                if (loadedTaglibs[uri] === true) {
                    return;
                }
                loadedTaglibs[uri] = true;
                
                //console.log('Loading taglib with URI "' + uri + '"...');
                
                var taglibInfo = registeredTaglibs[uri];
                
                
                if (!taglibInfo) {
                    errors.throwError(new Error('Unknown taglib "' + uri + '". The path to the package.json is not known.'));
                }
                
                var packagePath = taglibInfo.path,
                    searchPathEntry = taglibInfo.searchPathEntry,
                    registryPath = taglibInfo.registryPath;
                
                var packageResource = resources.findResource(packagePath, searchPathEntry);
                
                if (!packageResource.exists()) {
                    errors.throwError(new Error('Taglib package not found at path "' + packagePath + '" in search path entry "' + searchPathEntry + '". This taglib was referenced in "' + registryPath + '"'));
                }
                
                packaging.loadPackage(packageResource);
                
                
            },
            
            /**
             * 
             * @param taglibXml
             * @param path
             * @returns
             */
            loadTaglibXml: function(taglibXml, path) {
                var TaglibXmlLoader = raptor.require("templating.compiler.TaglibXmlLoader");
                var taglib = TaglibXmlLoader.load(taglibXml, path);
                compiler.addTaglib(taglib);
                return taglib;
            },
            
            /**
             * 
             * @param taglibXml
             * @param path
             * @returns
             */
            compileTaglib: function(taglibXml, path) {
                var TaglibXmlLoader = raptor.require("templating.compiler.TaglibXmlLoader");
                var taglib = TaglibXmlLoader.load(taglibXml, path);
                return "$rtld(" + json.stringify(taglib) + ")";
            }
           
        };
    });

raptor.extend(
    raptor.packaging,
    {
        load_taglib: function(include, manifest) {
            
            if (include.uri) {
                raptor.require("templating.compiler").loadTaglib(include.uri);
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
        
        load_template: function(include, manifest) {
            var resource = manifest.resolveResource(include.path);
            var xmlSource = resource.readFully();
            raptor.require("templating.compiler").compileAndLoad(xmlSource, resource.getSystemPath());
        }
    });