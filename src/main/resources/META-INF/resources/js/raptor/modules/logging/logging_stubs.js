
raptorBuilder.addLoader(function(raptor) {

    var extend = raptor.extend;
    
    /**
     * @class
     * @name logging-VoidLogger
     */
    var VoidLogger = function() {};

    VoidLogger.prototype = /** @lends logging-VoidLogger.prototype */ {
        
        /**
         * 
         */
        isDebugEnabled: function() {return false; },
        
        /**
         * 
         */
        isInfoEnabled: function() {return false;},
        
        /**
         * 
         */
        isWarnEnabled: function() {return false;},
        
        /**
         * 
         */
        isErrorEnabled: function() {return false;},
        
        /**
         * 
         */
        isFatalEnabled: function() {return false;},
        
        /**
         * 
         */
        dump: function(obj, desc, allProps) {},
        
        /**
         * 
         */
        debug: function(args) {},
        
        /**
         * 
         */
        info: function(args) {},
        
        /**
         * 
         */
        warn: function(args) {},
        
        /**
         * 
         */
        error: function(args) {},
        
        /**
         * 
         */
        fatal: function(args) {},
        
        /**
         * 
         */
        alert: function(args) {},
        
        /**
         * 
         */
        trace: function(args) {}
    };
    
    var voidLogger = new VoidLogger();

    raptor.defineCore('logging', {
        /**
         * 
         * @param className
         * @returns
         */
        logger: function(className)
        {
            return this.getVoidLogger();
        },

        /**
         * 
         */
        makeLogger: function(obj, className)
        {
            extend(obj, this.VoidLogger.prototype);
        },
//        
//        /**
//         * @type logging-VoidLogger
//         */
//        VoidLogger: VoidLogger,
        
        /**
         * 
         * @returns {logging-VoidLogger}
         */
        getVoidLogger: function() {            
            return voidLogger;
        }
    });

});
