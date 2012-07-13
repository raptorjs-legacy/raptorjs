$rload(function(raptor) {
    "use strict";
    
    var initialized = false,
        Module, 
        _enabled = false,
        originalWrapper,
        raptorWrapper = " var define=raptorCreateDefine(require); ",
        originalFindPath,
        strings = raptor.require('strings'),
        raptorFindPath = function(request, paths) {
            if (!strings.endsWith(request, ".js") && !strings.startsWith(request, ".")) { 
                var module = raptor.find(request);
                //console.log('find: ' + request, module);
                if (module) {
                    return request + '.raptor_module';
                }    
            }
            
            return originalFindPath.apply(this, arguments);
        };

    /**
     * @extension Node
     * @extensionFor amd
     * @raptor
     */
    raptor.amd = /** @lends listeners */ {
                  
        createDefine: function(nodeRequire) {
            return global.raptorCreateDefine(nodeRequire);
        },
        enable: function() {
            this.setEnabled(true);
        },
        
        disable: function() {
            this.setEnabled(false);
        },
        
        setEnabled: function(enabled) {
            if (_enabled === enabled) {
                return;
            }
            _enabled = enabled;
            

            if (!initialized) {
                require.extensions['.raptor_module'] = function(module, filename) {
                    module.exports = raptor.require(filename.substring(0, filename.length - '.raptor_module'.length));
                };
                
                Module = require('module').Module;
                originalWrapper = Module.wrapper[0];
                originalFindPath = Module._findPath;
                initialized = true;
            }

            if (enabled) {
                Module.wrapper[0] += raptorWrapper;
                Module._findPath = raptorFindPath;
            }
            else {
                Module.wrapper[0] = originalWrapper;
                Module._findPath = originalFindPath;
            }
        }
    };
    
    var amdConfig = raptor.getModuleConfig('amd');
    
    raptor.amd.config = raptor.config.create({
            "enabled": {
                value: amdConfig.enabled === true,
                onChange: function(value) {
                    raptor.amd.setEnabled(value);
                }
            }
        });
});

(function() {
    "use strict";
    
    var gatherDependencies = function(dependencies, builtins) {
            var i=0, 
                len=dependencies.length, 
                result=[], 
                dependency;
            
            for (; i<len; i++) {
                dependency = dependencies[i];
                result.push(builtins[dependency] || raptor.find(dependency));
            }
        
            return result;
        };

    global.raptorCreateDefine = function(nodeRequire) {
        var strings = raptor.strings,
            isString = raptor.isString,
            isArray = raptor.isArray;
        
        var define = function(id, dependencies, factory) {

            var args = arguments,
                exports = {},
                module = {
                  exports: exports
                },
                require = function(ids, callback) {
                    if (arguments.length == 1) {
                        return nodeRequire(ids);
                    }
                    
                    if (typeof callback !== 'function') {
                        raptor.throwError(new Error("Invalid call to require. Callback expected"));
                    }
                    
                    if (isString(ids)) {
                        ids = [ids];
                    }
                    else if (!isArray(ids)) {
                        raptor.throwError(new Error("Invalid call to require. Callback expected"));
                    }
                    
                    callback.apply(this, gatherDependencies(ids, {}));
                },
                builtins = {
                        require: require,
                        exports: exports,
                        module: module
                    };
                
            require.wrappedRequire = nodeRequire;
            
            if (args.length == 2) {
                if (isArray(id)) {
                    raptor.throwError(new Error("Invalid call to define. ID is required."));
                }
                else {
                    factory = dependencies;
                    dependencies = [];
                }
                //(id, factory)
                
            }
            
            if (!dependencies) {
                dependencies = [];
            }
            
            if (args.length == 1 || !isString(id) || !isArray(dependencies)) {
                raptor.throwError(new Error("Invalid call to define"));
            }
            
            dependencies = dependencies.concat(["require", "exports", "module"]);
            
            return raptor.define(id, {exports: exports}, function() {
                var result = factory.apply(exports, gatherDependencies(dependencies, builtins));
                return result === undefined ? module.exports : result;
            });
        };
        
        define.amd = {
                multiversion: true
            };
        
        return define;
    };
}());
