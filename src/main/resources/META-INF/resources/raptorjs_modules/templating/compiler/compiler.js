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
             * Creates a new object that can be used to compile templates with the
             * provided options.
             * 
             * <p>
             * Allowed options:
             * <ul>
             *  <li>
             *      <b>preserveWhitespace</b> (object|boolean): An object that defines which elements should
             *          have their whitespace preserved. While most whitespace gets normalized
             *          in HTML documents, some HTML elements make use of their whitespace (e.g. PRE and TEXTAREA tags).
             *          If this option is set to "true" then all whitespace is preserved.
             *          
             *          <p>
             *          Default value:
<pre>
{
    'pre': true,
    'textarea': true
}
</pre>
             *  </li>
             *  <li>
             *      <b>allowSelfClosing</b> (object): An object that defines which elements are allowed
             *          to be self-closing. By default, all elements are allowed to be self-closing.
             *          Some browsers do not handle certain HTML elements that are self-closing
             *          and require a separate ending tag.
             *          
             *          <p>
             *          Default value:
<pre>
allowSelfClosing: {
    'script': false,
    'div': false
}
</pre>
             *  </li>
             *  <li>
             *      <b>startTagOnly</b> (object): An object that defines which elements should only be
             *          written out with the opening tag and not the closing tags. For HTML5
             *          output that is not well-formed XML it is acceptable to write
             *          certain elements with the opening tag only.
             *          
             *          <p>
             *          Default value:
<pre>
startTagOnly: {
    'img': true,
    'br': true
}
</pre>
             *  </li>
             * </ul>
             * 
             * @param options Compiler options (see above)
             * @returns {templating.compiler$TemplateCompiler} The newly created compiler
             */
            createCompiler: function(options) {
                
                if (!taglibsLoaded) {
                    /*
                     * Lazily discover taglibs when we create the first compiler.
                     * Taglibs are discovered by finding and loading all "/taglib-registry.json"
                     * resources in the resource search path.
                     */
                    taglibsLoaded = true; //Prevent taglibs from being discovered again by setting the necessary flag
                    
                    if (this.discoverTaglibs) { //Only discover taglibs if that method is implemented
                        this.discoverTaglibs(); //The discoverTaglibs method is implemented on the server so execute it now
                    }
                }
                
                var TemplateCompiler = raptor.require("templating.compiler.TemplateCompiler"); //Get a reference to the TemplateCompiler class 
                if (options) {
                    /*
                     * If options were provided then they should override the default options.
                     * NOTE: Only top-level properties are overridden
                     */
                    options = extend(
                            extend({}, defaultOptions), //Create a clone of the default options that can be extended 
                            options);
                }
                else {
                    options = defaultOptions; //Otherwise, no options were provided so use the default options
                }
                return new TemplateCompiler(taglibs, options);
            },
            
            /**
             * Compiles an XML template by creating a new compiler using the provided options and
             * then passing along the XML source code for the template to be compiled. 
             * 
             * For a list of options see {@link templating.compiler.createCompiler}
             * 
             * @param xmlSource {String} The XML source code for the template to compile
             * @param path {String} The path to the template (for debugging/error reporting purposes only)
             * @returns {String} The JavaScript code for the compiled template.
             */
            compile: function(xmlSource, path, options) {
                return this.createCompiler(options).compile(xmlSource, path);
            },
            
            /**
             * 
             * @param xmlSource {String} The XML source code for the template to compile
             * @param path {String} The path to the template (for debugging/error reporting purposes only)
             * @returns {void}
             */
            compileAndLoad: function(xmlSource, path, options) {
                this.createCompiler(options).compileAndLoad(xmlSource, path);
            },
            
            /**
             * Adds a {@link templating.compiler$Taglib} instance to the internal {@link templating.compiler$TaglibCollection} so
             * that the taglib is available to all compilers.
             * 
             * @param taglib {templating.compiler$Taglib} The taglib to add
             * @returns {void}
             */
            addTaglib: function(taglib) {
                taglibs.add(taglib); 
            }
        };
    });

/*
 * Add a global function that can be used to register taglibs
 */
raptor.global.$rtld = function(taglib) {
    raptor.require('templating.compiler').addTaglib(taglib);
};