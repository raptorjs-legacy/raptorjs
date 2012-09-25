raptor.define(
    "jsdoc.ParamTag",
    "jsdoc.Tag",
    function(raptor) {


        var typeRegExp = /^\s*\{([^\}]*)\}\s*/g,
            strings = raptor.require('strings');

        var ParamTag = function(name, value) {
            ParamTag.superclass.constructor.apply(this, arguments);

            var paramDesc = value;
            var paramName = null;
            var paramType = null;

            var extractType = function() {
                typeRegExp.lastIndex = 0;
                var matches = typeRegExp.exec(paramDesc);
                if (matches) {
                    paramType = matches[1];
                    paramDesc = paramDesc.substring(typeRegExp.lastIndex);
                }
            };

            var extractName = function() {
                var paramEnd = paramDesc.indexOf(' ');
                if (paramEnd !== -1) {
                    paramName = paramDesc.substring(0, paramEnd);
                    paramDesc = strings.ltrim(paramDesc.substring(paramEnd+1));
                }
                else {
                    paramName = paramDesc;
                    paramDesc = "";
                }
            }

            extractType();
            extractName();
            if (!paramType) {
                extractType();
            }

            this.paramName = paramName;
            this.paramDesc = paramDesc;
            this.paramType = paramType;
        };

        ParamTag.prototype = {

        };

        return ParamTag;
    });