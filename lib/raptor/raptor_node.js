exports.load = function(raptor) {
    raptor.global = global;
    
    
    
    
    if (!global.raptorCreateDefine) {
        
        var raptorWrapper = " if (global.raptorCreateDefine) { define=global.raptorCreateDefine(module); } ",
            Module = require('module').Module,
            wrapper = Module.wrapper;
            originalFindPath = Module._findPath,
            raptorFindPath = function(request, paths) {
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
        
        Module._findPath = raptorFindPath;
        wrapper[0] = wrapper[0].replace(/\s*\)/, ', define)') + raptorWrapper;
        global.raptorCreateDefine = raptor.createDefine;
    }
}
