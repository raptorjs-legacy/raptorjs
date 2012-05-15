$rload(function(raptor) {
    /**
     * @extension Browser
     */
    raptor.defineCore('env', {
        /**
         * 
         * @returns
         */
        getGlobal: function() {
            return window;
        },
        
        /**
         * 
         * @returns {String}
         */
        getName: function() {
            return 'browser';
        }
    });
    
    raptor.global = window;
});