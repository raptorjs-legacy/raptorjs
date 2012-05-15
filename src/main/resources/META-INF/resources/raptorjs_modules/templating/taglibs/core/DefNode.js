raptor.defineClass(
    'templating.taglibs.core.DefNode',
    'templating.compiler.Node',
    function() {
        var errors = raptor.errors,
            strings = raptor.require('strings'),
            funcDefRegExp = /^([A-Za-z_][A-Za-z0-9_]*)\(((?:[A-Za-z_][A-Za-z0-9_]*,\s*)*[A-Za-z_][A-Za-z0-9_]*)?\)$/;
        
        var DefNode = function(props) {
            DefNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        DefNode.prototype = {

            doGenerateCode: function(template) {
                
                var func = this.getProperty("function");
                
                if (!func) {
                    errors.throwError(new Error('"function" attribute is required'));
                }
                
                func = strings.trim(func);
                
                var matches = funcDefRegExp.exec(func);
                if (matches) {
                    var name = matches[1];
                    var params = matches[2].split(/\s*,\s*/);

                    var definedFunctions = template.getAttribute("core:definedFunctions");
                    if (!definedFunctions) {
                        definedFunctions = template.setAttribute("core:definedFunctions", {});
                    }
                    
                    definedFunctions[name] = {
                        params: params
                    };
                }
                else {
                    raptor.throwError(new Error('Invalid function name of "' + func + '".'));
                }
               
                template.addJavaScriptCode('function ' + func + '{return ' + template.getStaticHelperFunction("noEscapeXml", "nx") + '(context.captureString(function(){');
                this.generateCodeForChildren(template);
                template.addJavaScriptCode('}));}');
            }
            
        };
        
        return DefNode;
    });