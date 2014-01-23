define.Class('raptor/jsdoc/ReturnTag', 'raptor/jsdoc/Tag', function (require, exports, module) {
    'use strict';
    var typeRegExp = /^\s*\{([^\}]*)\}\s*/g;
    var ReturnTag = function (name, value) {
        ReturnTag.superclass.constructor.call(this, 'return', value);
        var returnDesc = value;
        var returnType = null;
        var extractType = function () {
            typeRegExp.lastIndex = 0;
            var matches = typeRegExp.exec(returnDesc);
            if (matches) {
                returnType = matches[1];
                returnDesc = returnDesc.substring(typeRegExp.lastIndex);
            }
        };
        extractType();
        this.returnDesc = returnDesc;
        this.returnType = returnType;
    };
    ReturnTag.prototype = {};
    return ReturnTag;
});