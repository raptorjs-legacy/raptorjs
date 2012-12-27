define(
    "taglibs.jsdoc.JSDocFunctions",
    ['raptor'],
    function(raptor, require) {
        
        var jsdocUtil = require('jsdoc-util');
        
        var funcs = {
            symbolUrl: function(symbolName) {
                return jsdocUtil.symbolUrl(symbolName, this);
            }
        };
        
        return funcs;
        
    });
    