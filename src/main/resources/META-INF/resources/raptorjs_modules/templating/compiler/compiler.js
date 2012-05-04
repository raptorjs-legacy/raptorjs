raptor.defineModule(
    "templating.compiler", 
    function(raptor) {

        var TaglibCollection = raptor.require('templating.compiler.TaglibCollection'),
            taglibs = new TaglibCollection(),
            extend = raptor.extend,
            errors = raptor.require('errors'),
            taglibsLoaded = false,
            resources = raptor.require("resources"),
            defaultOptions = {
                preserveWhitespace: {
                    'pre': true,
                    'textarea': true
                },
                allowSelfClosing: {
                    'script': false,
                    'div': false
                },
                startTagOnly: {
                    'img': true,
                    'br': true
                }
            };
        
        
        
        return {

            /**
             * 
             * @param options
             * @returns
             */
            createCompiler: function(options) {
                
                if (!taglibsLoaded) {
                    taglibsLoaded = true;
                    
                    if (this.discoverTaglibs) {
                        this.discoverTaglibs();
                    }
                }
                
                var TemplateCompiler = raptor.require("templating.compiler.TemplateCompiler");
                if (options) {
                    options = extend(defaultOptions, options);
                }
                else {
                    options = defaultOptions;
                }
                return new TemplateCompiler(taglibs, options);
            },
            
            /**
             * 
             * @param xmlSource
             * @param path
             * @returns
             */
            compile: function(xmlSource, path, options) {
                return this.createCompiler(options).compile(xmlSource, path);
            },
            
            /**
             * 
             * @param xmlSource
             * @param path
             * @returns
             */
            compileAndLoad: function(xmlSource, path) {
                
                
                var js = this.createCompiler().compile(xmlSource, path);
                
                raptor.require("templating");
                
                try
                {
                    eval(js);
                }
                catch(e) {
                    errors.throwError(new Error('Unable to load template at path "' + path + '". Exception: ' + e.message), e);
                }
            },
            
            /**
             * 
             * @param taglib
             * @returns
             */
            addTaglib: function(taglib) {
                taglibs.add(taglib);
            }
        };
    });

raptor.global.$rtld = function(taglib) {
    raptor.require('templating.compiler').addTaglib(taglib);
};