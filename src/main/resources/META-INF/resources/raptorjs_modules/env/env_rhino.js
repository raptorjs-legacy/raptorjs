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


(function() {
    var RHINO_GLOBAL = this;
    
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
                return RHINO_GLOBAL;
            },
            
            /**
             * 
             */
            getName: function() {
                return 'rhino';
            }
        });
        
        raptor.global = RHINO_GLOBAL;
    });
}());