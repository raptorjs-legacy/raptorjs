/**
 * @namespace
 * @name env
 */

/**
 * @function
 * @memberOf env
 * @name getGlobal
 */

/**
 * @function
 * @memberOf env
 * @name getName
 */

$rload(function(raptor) {
    /**
     * @extension Node
     */
    raptor.defineCore('env', {
        /**
         * 
         * @returns
         */
        getGlobal: function() {
            return GLOBAL;
        },
        
        /**
         * 
         */
        getName: function() {
            return 'node';
        }
    });
    
    raptor.global = GLOBAL;
});