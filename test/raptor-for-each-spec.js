require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

var logger = require('raptor/logging').logger('raptor-dev-spec'),
    compileAndLoad = helpers.templating.compileAndLoad,
    compileAndRender = helpers.templating.compileAndRender,
    compileAndRenderAsync = helpers.templating.compileAndRenderAsync,
    runAsyncFragmentTests = helpers.templating.runAsyncFragmentTests,
    MockWriter = helpers.templating.MockWriter;

describe('raptor for each spec', function() {

    it("should work with standard iteration", function() {
        var output = compileAndRender("/test-templates/looping.rhtml",{});
        expect(output).toEqual('abca - true - false - 0 - 3, b - false - false - 1 - 3, c - false - true - 2 - 3<div>red - true - false - 0 - 3</div>, <div>green - false - false - 1 - 3</div>, <div>blue - false - true - 2 - 3</div>');
    });


    it("should work with custom iteration", function() {
        var output = compileAndRender("/test-templates/looping-iterator.rhtml", 
        	{
				reverseIterator: function(arrayList, callback){
                	var statusVar = {first: 0, last: arrayList.length-1};
		            for(var i=arrayList.length-1; i>=0; i--){
        	        	statusVar.index = i;
            			callback(arrayList[i], statusVar);
            		}
            	}
        	}
        );
        expect(output).toEqual('cba2-c1-b0-a<div>c</div><div>b</div><div>a</div><div>2-c</div><div>1-b</div><div>0-a</div>');
    });
});
