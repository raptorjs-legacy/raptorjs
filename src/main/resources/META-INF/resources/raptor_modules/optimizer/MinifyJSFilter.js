raptor.define(
    'optimizer.MinifyJSFilter',
    function() {
        return {
            filter: function(code, contentType, include, bundle) {
                if (contentType === 'application/javascript') {
                    return raptor.require("js-minifier").minify(code);
                }
                else {
                    return code;
                }
            }
        };
    });