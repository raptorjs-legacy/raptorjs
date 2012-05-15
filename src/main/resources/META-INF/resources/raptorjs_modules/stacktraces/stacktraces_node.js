$rload(function(raptor) {

    raptor.defineCore('stacktraces', {
        trace : function(e) {
            var out = [];
            while (e) {
                
                out[out.length] = '' + (e.stack || e.message || e);
                
                e = e.__cause__;
                if (e) {
                    out[out.length] = '\n\nCaused by:\n';
                }
            }
            return 'Stack trace:\n' +  out.join('');
        }
    });    
});