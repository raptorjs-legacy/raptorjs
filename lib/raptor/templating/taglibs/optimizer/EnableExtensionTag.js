define(
    'raptor/templating/taglibs/optimizer/EnableExtensionTag',
    function(require, exports, module) {
        'use strict';
        
        var optimizer = require('raptor/optimizer');
        
        return {
            process: function(input, context) {
                optimizer.enableExtensionForContext(context, input.name);
            }
        };
    });