raptor.define(
    'optimizer.MinifyCSSFilter',
    function() {
        "use strict";
        
        var strings = raptor.require('strings');
        
        return {
            filter: function(code, contentType, dependency, bundle) {
                if (contentType === 'text/css') {
                    var mergeDuplicates = dependency.mergeDuplicates !== false;

                    var minified = raptor.require("css-minifier").minify(code, {
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

