define.extend('raptor/templating/compiler/TemplateCompiler', function(require, target) {
    "use strict";
    
    var vm = require('vm');

    return {
        _eval: function(compiledSrc, resource) {
            eval(compiledSrc);
            return;
            
            var filePath;
            if (resource) {
                if (typeof resource === 'string') {
                    filePath = resource;
                }
                else if (require('raptor/resources').isResource(resource)) {
                    filePath = resource.getURL();
                }
            }
            
            vm.runInThisContext(compiledSrc, filePath || null);
        }
    };
});