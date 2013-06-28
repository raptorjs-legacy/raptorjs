define(
    'raptor/optimizer/MinifyCSSFilter',
    function(require, exports, module) {
        "use strict";
        
        var strings = require('raptor/strings');
        
        return {
            contentType: 'text/css',
            
            name: module.id,

            filter: function(code, contentType, dependency, bundle) {
                if (contentType === 'text/css') {
                    var mergeDuplicates = dependency.mergeDuplicates !== false;

                    var minified = require('raptor/css-minifier').minify(code, {
                        mergeDuplicates: mergeDuplicates
                    });
                    
                    return minified;
                }
                else {
                    return code;
                }
            }
        };
    });

