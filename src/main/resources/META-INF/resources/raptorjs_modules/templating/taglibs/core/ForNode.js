raptor.defineClass(
    'templating.taglibs.core.ForNode',
    'templating.compiler.Node',
    function() {
        var errors = raptor.errors,
            forEachRegEx = /^(.+)\s+in\s+(.+)$/,
            stringify = raptor.require("json.stringify").stringify,
            parseForEach = function(value) {
                var match = value.match(forEachRegEx);
                if (!match) {
                    errors.throwError(new Error("Invalid each attribute: " + value));
                }
                return {
                    "var": match[1],
                    "in": match[2]
                };
            };
        
        var ForNode = function(props) {
            ForNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);    
            }
        };

        ForNode.prototype = {
            doGenerateCode: function(template) {
                var each = this.getProperty("each"),
                    separator = this.getProperty("separator"),
                    varStatus = this.getProperty("varStatus");
                
                if (!each) {
                    console.error("for props: ", props);
                    errors.throwError(new Error('"each" attribute is required'));
                }
                
                var parts = parseForEach(each);
                
                var items = parts["in"];
                var varName = parts["var"];
                if (separator && !varStatus) {
                    varStatus = "__loop";
                }
                
                var forEachParams = [varName];
                if (varStatus) {
                    forEachParams.push(varStatus);
                }
                
                template.addJavaScriptCode(template.getStaticHelperFunction("forEach", "f") + '(' + items + ',function(' + forEachParams.join(",") + '){');
                this.generateCodeForChildren(template);
                if (separator) {
                    template.addJavaScriptCode("if (!" + varStatus + ".isLast()){");
                    template.addWrite(template.isExpression(separator) ? separator.getExpression() : stringify(separator));
                    template.addJavaScriptCode("}");
                }
                template.addJavaScriptCode('});');
            }
        
        };
        
        return ForNode;
    });