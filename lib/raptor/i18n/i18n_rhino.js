define.extend('raptor/i18n', function(require, exports, module) {
    var vm = require('vm');
    return {
        _eval: function(code) {
            __rhinoHelpers.runtime.evaluateString(code);
        }
    };
});