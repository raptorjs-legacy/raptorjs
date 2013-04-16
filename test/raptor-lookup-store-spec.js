require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe("lookup store spec", function(){

	it('should allow to set multiple key as an object', function() {

		var modulesMetaData = {
			'module-A': {
				'js': 'test-a.js',
				'css': 'test-a.css'
			},

			'module-B': {
				'js': 'test-b.js',
				'css': 'test-b.css'
			}
		};

		$rset('loaderModules', modulesMetaData);

		var moduleA = $rget('loaderModules', 'module-A');

		expect(moduleA).toNotEqual(null);

		expect(moduleA['js']).toEqual('test-a.js');
		expect(moduleA['css']).toEqual('test-a.css');  
    });

    it('should allow to set key and value', function() {

		
		$rset('category1', 'key1', 'value1');
		$rset('category2', 'key2', 'value2');

		var key1 = $rget('category1', 'key1');
		var key2 = $rget('category2', 'key2');

		expect(key1).toNotEqual(null);
		expect(key2).toNotEqual(null);

		expect(key1).toEqual('value1');
		expect(key2).toEqual('value2');  
    });

});