raptor.defineClass(
    'templating.taglibs.core.InvokeNode',
    'templating.compiler.Node',
    function() {
        var errors = raptor.errors,
            forEach = raptor.forEach;
        
        var InvokeNode = function(props) {
            InvokeNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        InvokeNode.prototype = {

            doGenerateCode: function(template) {
                
                var func = this.getProperty("function");
                
                if (!func) {
                    errors.throwError(new Error('"function" attribute is required'));
                }
                
                if (func.indexOf('(') === -1) {
                    var definedFunctions = template.getAttribute("core:definedFunctions");
                    if (!definedFunctions) {
                        raptor.throwError(new Error('Function with name "' + func + '" not defined using <c:define>.'));
                    }
                    var funcDef = definedFunctions[func];
                    if (!funcDef) {
                        raptor.throwError(new Error('Function with name "' + func + '" not defined using <c:define>.'));
                    }
                    var params = funcDef.params || [];
                    
                    var argParts = [];
                    
                    var validParamsLookup = {};
                    /*
                     * Loop over the defined parameters to figure out the names of allowed parameters and add them to a lookup
                     */
                    forEach(params, function(param) {
                        validParamsLookup[param] = true;
                    }, this);
                    
                    /*
                     * VALIDATION:
                     * Loop over all of the provided attributes and make sure they are allowed 
                     */
                    this.forEachProperty(function(name, value) {
                        if (name === 'function') {
                            return;
                        }
                        
                        if (!validParamsLookup[name]) {
                            raptor.throwError(new Error('Parameter with name "' + name + '" not supported for function with name "' + func + '". Allowed parameters: ' + params.join(", ")));
                        }
                    }, this);
                    
                    /*
                     * One more pass to build the argument list
                     */
                    forEach(params, function(param) {
                        validParamsLookup[param] = true;
                        var arg = this.getAttribute(param);
                        if (arg == null) {
                            argParts.push("undefined");
                        }
                        else {
                            argParts.push(this.getProperty(param));
                        }
                    }, this);
                    
                    template.addWrite(func + "(" + argParts.join(",") + ")");
                }
                else {
                    template.addJavaScriptCode(func + ";");
                }
            }
            
        };
        
        return InvokeNode;
    });