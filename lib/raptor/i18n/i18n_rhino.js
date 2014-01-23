define.extend('raptor/i18n', function (require, exports, module) {
    return {
        _eval: function (code) {
            __rhinoHelpers.runtime.evaluateString(code);
        }
    };
});