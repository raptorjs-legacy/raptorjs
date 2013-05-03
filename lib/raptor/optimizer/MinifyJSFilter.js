define(
    'raptor/optimizer/MinifyJSFilter',
    function(require, exports, module) {
        "use strict";
        
        var strings = require('raptor/strings');
        
        return {
            contentType: 'application/javascript',

            name: module.id,

            filter: function(code, contentType, dependency, bundle) {
                if (contentType === 'application/javascript') {
                    var minified = require('raptor/js-minifier').minify(code);
                    if (minified.length && !strings.endsWith(minified, ";")) {
                        minified += ";";
                    }
                    return minified;
                }
                else {
                    return code;
                }
            }
        };
    });