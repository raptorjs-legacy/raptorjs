exports.load = function(raptor) {
    'use strict';

    raptor.global = global;
    raptor.sourceDir = __dirname;    

    if (!global.raptorExtendDefine) {
        global.__raptor = raptor;

        var raptorWrapper = " function define() { if (global.__raptor) { return global.__raptor._define(arguments, define.require); } } if (global.raptorExtendDefine) { global.raptorExtendDefine(define, module); }",
            Module = require('module').Module,
            wrapper = Module.wrapper,
            origWrapper0 = wrapper[0],
            originalFindPath = Module._findPath,

            raptorFindPath = function(request, paths) {

                if (request.endsWith('.js') || request.endsWith('.node')) {
                    return originalFindPath.apply(this, arguments);
                }
                
                var lastDot = request.lastIndexOf('.');
                if (lastDot !== -1 && request.substring(lastDot+1) === 'raptor_module') {
                    return request;
                }

                var raptorId = raptor.normalize(request);
                if (raptorId.charAt(0) !== '.' && raptor.exists(raptorId)) {
                    return raptorId + '.raptor_module';
                }
                else {
                    return originalFindPath.apply(this, arguments);
                }
            };
            
        require.extensions['.raptor_module'] = function(module, filename) {
            module.exports = raptor.require(filename.slice(0, 0 - '.raptor_module'.length));
        };
        
        Module.uninstallRaptor = function() {
            this._findPath = originalFindPath;
            this.wrapper[0] = origWrapper0;
            delete global.__raptor;
            delete global.raptorExtendDefine;
            delete Module.uninstallRaptor;
        };

        global.uninstallRaptor = Module.uninstallRaptor.bind(Module);

        Module._findPath = raptorFindPath;
        wrapper[0] += raptorWrapper;
        //wrapper[0] = wrapper[0].replace(/\s*\)/, ', define)') + raptorWrapper;
        global.raptorExtendDefine = raptor._extendDefine;
    }
};
