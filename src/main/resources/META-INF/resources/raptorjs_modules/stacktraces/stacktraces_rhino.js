$rload(function(raptor) {

    var trim = function() {
        
    };
    
    raptor.defineCore('stacktraces', {
        trace: function(e) {
            if (arguments.length === 1) {
                var rhinoException = e.rhinoException;
                if (rhinoException)
                {
                    if (rhinoException.getScriptStackTrace) {
                        return rhinoException.getScriptStackTrace();
                    }
                    else {
                        rhinoException.printStackTrace();
                    }
                }
                else {
                    return null;
                }
            }
            else if (arguments.length === 0){
                return this.traceAndTrim(1);
            }
        },
        
        traceAndTrim: function(trimCount) {
            trimCount++;
            
            var trace = '';
            
            try
            {
                this.triggerError();
            }
            catch(e) {
                trace = this.trace(e);
                var lines = trace.split("\n");
                if (lines.length >= trimCount) {
                    lines.splice(0, trimCount);
                }
                trace = lines.join("\n");
            }
            
            return trace;
            
        }
    });    
});