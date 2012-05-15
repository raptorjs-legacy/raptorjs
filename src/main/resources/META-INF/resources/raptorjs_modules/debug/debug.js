$rload(function(raptor) {

    raptor.defineCore('debug', {
        /**
         * 
         * @param o
         * @returns
         */
        dumpToString : function(o) {
            return raptor.require('json').stringify(o); //For now just use json.stringify
        }
    });    
});