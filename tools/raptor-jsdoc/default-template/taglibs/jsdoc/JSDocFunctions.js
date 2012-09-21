raptor.define(
    "taglibs.jsdoc.JSDocFunctions",
    function(raptor) {
        
        var jsdocUtil = raptor.require('jsdoc-util');
        
        var funcs = {
            symbolUrl: function(symbolName) {
                return jsdocUtil.symbolUrl(symbolName, this);
            }
        };
        
        return funcs;
        
    });
    