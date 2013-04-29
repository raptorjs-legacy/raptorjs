define(
    'test/optimizer/filters/JavaScriptFilter1Async',
    function(require) {
        var promises = require('raptor/promises');
        return {
            filter: function(code, contentType, context) {
                if (contentType === 'application/javascript') {
                    var deferred = promises.defer();
                    setTimeout(function() {
                        deferred.resolve(code + '-JavaScriptFilter1Async');
                    }, 200);
                    return deferred.promise;
                }
                else {
                    return code;
                }
            }
        };
    })