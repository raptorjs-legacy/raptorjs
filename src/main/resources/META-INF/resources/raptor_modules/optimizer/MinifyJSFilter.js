raptor.define(
    'optimizer.MinifyJSFilter',
    function() {
        var strings = raptor.require('strings');
        
        return {
            filter: function(code, contentType, include, bundle) {
                if (contentType === 'application/javascript') {
                    var minified = raptor.require("js-minifier").minify(code);
                    if (minified.length && !strings.endsWith(minified, ";") && !strings.endsWith(minified, "}")) {
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