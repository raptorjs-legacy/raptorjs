
window.executeTest = function(expect, completeCallback, config) {
    window.console = config.console;
        
    var baseUrl = config.baseUrl;
    
    var loader = raptor.require('loader');
    var _this = {};
    
    loader.includeJS(baseUrl + "/js1.js", function(result) {
        
        expect(window.loader_js1).toEqual(true);
        expect(result.success).toEqual(true);
        expect(this).toEqual(_this);
        completeCallback();
    }, _this);
    
};



