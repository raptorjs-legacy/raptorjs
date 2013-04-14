exports.load = function(raptor) {
    "use strict";

    raptor.global = global;
    raptor.sourceDir = __dirname;

    global.__raptor = raptor;

    if (!global.raptorCreateDefine) {
        
        var raptorWrapper = " if (global && global.raptorCreateDefine) { define=global.raptorCreateDefine(module); } ",
            Module = require('module').Module,
            wrapper = Module.wrapper,
            origWrapper0 = wrapper[0],
            originalFindPath = Module._findPath,

            raptorFindPath = function(request, paths) {
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
            delete global.raptorCreateDefine;
            delete Module.uninstallRaptor;
        };

        global.uninstallRaptor = Module.uninstallRaptor.bind(Module);

        Module._findPath = raptorFindPath;
        wrapper[0] = wrapper[0].replace(/\s*\)/, ', define)') + raptorWrapper;
        global.raptorCreateDefine = raptor.createDefine;
    }
};
