define(
    'raptor/templating/taglibs/async/AsyncFragmentTagTransformer',
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        return {
            process: function(node, compiler, template) {
                
                var argProps = [];

                var propsToRemove = [];

                node.forEachProperty(function(uri, name, value) {
                    if (uri == '' && name.startsWith('arg-')) {
                        var argName = name.substring('arg-'.length);
                        argProps.push(JSON.stringify(argName) + ": " + value);
                        propsToRemove.push(name);
                    }
                });

                propsToRemove.forEach(function(propName) {
                    node.removeProperty(propName);
                });

                var argString;
                if (argProps.length) {
                    argString = "{" + argProps.join(", ") + "}";
                }

                var arg = node.getProperty('arg');
                if (arg) {
                    argString = 'require("raptor").extend(' + arg + ', ' + argString +')';
                }

                if (argString) {
                    node.setProperty("arg", template.makeExpression(argString));    
                }
                
                
            }
        };
    });