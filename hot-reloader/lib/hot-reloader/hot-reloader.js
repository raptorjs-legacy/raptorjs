var fs = require('fs');

exports.watch = function(req, name, callback, thisObj) {
	
	var filename = req.resolve(name);
	var oldModule = req(name);
	
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