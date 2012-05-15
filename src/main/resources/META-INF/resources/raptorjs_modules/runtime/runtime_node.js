$rload(function(raptor) {

    var logger = raptor.logging.logger('runtime');
    
    raptor.extendCore('runtime', {
        evaluateFile: function(filePath) {    
            logger.debug('Evaulating file: ' + filePath);
            require(filePath);
        }
    });

});