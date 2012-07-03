require('./_helper.js');


var def = typeof define === 'undefined' ? null : define;
	
if (!def) {
	def = raptor.require('amd').createDefine(require);
}

describe('amd module', function() {
	
	var define = def,
	    loadCounts = {
    	    moduleA: 0,
        	moduleB: 0,
        	moduleC: 0
    	};
	
    before(function() {
    	
    	
    	define("amd/moduleA", function(require, exports, module) {
    		exports.isModuleA = true;
    		loadCounts.moduleA++;
    	});

    	define("amd/moduleB", ["amd/moduleA"], function(moduleA, require, exports, module) {
    		loadCounts.moduleB++;
    		return {
    			moduleA: moduleA,
    			moduleC: require('amd/moduleC'),
    			isModuleB: true
    		};
    	});

    	define("amd/moduleC", ["amd/moduleA"], function(moduleA, require, exports, module) {
    		loadCounts.moduleC++;
    		module.exports = {
    	        isModuleC: true
    		};
    	});
    });
    
    it('should support require without a callback', function() {
    	var moduleA,
            moduleB,
            moduleC;
       
    	define("amd/callback/a", function(require, exports, module) {
            moduleA = require("amd/moduleA");
            moduleB = require("amd/moduleB");
            moduleC = require("amd/moduleC");
    	});
    	
    	require("amd/callback/a");
    	
        expect(moduleB.moduleA).toEqual(moduleA);
        expect(moduleB.moduleC).toEqual(moduleC);
        
        expect(moduleA.isModuleA).toEqual(true);
        expect(moduleB.isModuleB).toEqual(true);
        expect(moduleC.isModuleC).toEqual(true);
        
    });
    
    it('should support define...require', function() {
        
    	var moduleA,
            moduleB,
            moduleC;
       
    	define("amd/callback/b", ["amd/moduleA", "amd/moduleB", "amd/moduleC"], function(_moduleA, _moduleB, _moduleC) {
            moduleA = _moduleA;
            moduleB = _moduleB;
            moduleC = _moduleC;
    	});
    	
    	require("amd/callback/b");
    	
    	expect(moduleB.moduleA).toEqual(moduleA);
        expect(moduleB.moduleC).toEqual(moduleC);
        
        expect(moduleA.isModuleA).toEqual(true);
        expect(moduleB.isModuleB).toEqual(true);
        expect(moduleC.isModuleC).toEqual(true);
    });
    
    it('should only load modules once', function() {
    	require("amd/moduleA");
        require("amd/moduleB");
        require("amd/moduleC");
        
        require("amd/moduleA");
        require("amd/moduleB");
        require("amd/moduleC");
        
        require("amd/moduleA");
        require("amd/moduleB");
        require("amd/moduleC");

    	expect(loadCounts.moduleA).toEqual(1);
    	expect(loadCounts.moduleB).toEqual(1);
    	expect(loadCounts.moduleC).toEqual(1);
    	
    	define("amd/callback/c", function(require, exports, module) {
    		require(["amd/moduleA", "amd/moduleB", "amd/moduleC"], function(moduleA, moduleB, moduleC) {    		
        	});
    	});
    	
    	require("amd/callback/c");
    	
    	expect(loadCounts.moduleA).toEqual(1);
    	expect(loadCounts.moduleB).toEqual(1);
    	expect(loadCounts.moduleC).toEqual(1);
    });

});