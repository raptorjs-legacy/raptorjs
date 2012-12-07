require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe('json module', function() {

    it('should have the non-native JSON object available', function() {
        var json = require('raptor/json');
        json.setImpl('raptor');
        
        expect(json.stringify).toEqual(json.raptorStringify);
        expect(json.parse).toEqual(json.raptorParse);
        
     });

    it('should support a non-native parser', function() {
        var json = require('raptor/json');
        json.setImpl('raptor');
        
        expect(json.parse).toEqual(json.raptorParse);
        var o = json.parse('{a: 100}');
        expect(o.a).toEqual(100);
        
        
     });
    
    it('should produce a deserialized object that matches the original object when using the non-native parser', function() {
        var json = require('raptor/json');
        json.setImpl('native');
        
        
        var o = {
            "array": [1, 2, 3],
            "array2": [{a: 1}],
            "test": "hello"
        };
        
        var jsonStr = json.stringify(o);
        var o2 = json.parse(jsonStr);
        expect(o).toEqual(o2);
     });
    
    it('should support a native parser', function() {
        var json = require('raptor/json');
        json.setImpl('native');
        
        var _e = null;
        
        try
        {
            json.parse('{a: 100}');
        }
        catch(e) {
            _e = e;
        }
        
        expect(_e).toNotEqual(null);
        expect(_e.toString().toLowerCase()).toContain('syntaxerror');
        
        var o = json.parse('{"a": 100}');        
        expect(o.a).toEqual(100);
        
        o = {
            "array": [1, 2, 3],
            "array2": [{a: 1}],
            "test": "hello"
        };
        
        var jsonStr = json.stringify(o);
        
        
        var o2 = json.parse(jsonStr);
        expect(o2.test).toEqual("hello");
        
        expect(o).toEqual(o2);
     });
    
    it('should support escaping of backslash', function() {
        var stringify = require('raptor/json/stringify');
        expect(stringify("\\")).toEqual('"\\\\"');
        expect(stringify("\\", {useSingleQuote: true})).toEqual("'\\\\'");
        //expect(stringify("TEST\\")).toEqual('"\\n{1}\\nTEST\\\\"');
        
        
     });
});