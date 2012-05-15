$rload(function(raptor) {

    var logger = raptor.logging.logger('runtime');
    
    raptor.extendCore('runtime', {
        evaluateFile: function(filePath) {    
            __rhinoHelpers.getRuntime().evaluateFile(filePath);
        },
    
        evaluateString: function(source, filePath) {    
            __rhinoHelpers.getRuntime().evaluateString(source, filePath);
        }
    });

});