var fs = require('fs');

exports.watch = function(req, name, callback, thisObj) {
	
	if (typeof req === 'string') {
	    req = require;
	    name = arguments[0];
	    callback = arguments[1];
	    thisObj = arguments[2];
	}
	
	var filename = req.resolve(name);
    var oldModule = req(filename);
    
	var watcher = fs.watch(filename, function() {
		delete req.cache[filename];
		var newModule = req(filename);
		for (var k in newModule) {
			if (newModule.hasOwnProperty(k)) {
				oldModule[k] = newModule[k];
			}
		}
		
		req.cache[filename] = oldModule;

		if (callback) {
			callback.call(thisObj, name, newModule, oldModule);
		}
	});
	return watcher;
};