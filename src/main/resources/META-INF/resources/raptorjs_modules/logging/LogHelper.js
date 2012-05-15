$rload(function(raptor) {
        
    var stacktraces = raptor.stacktraces,
        arrayFromArguments = raptor.arrayFromArguments;
    
    /**
     * @class
     * @name logging_Console$LogHelper
     */
    var LogHelper = function() {
        this.parts = [];
    };

    LogHelper.prototype = /** @lends logging_Console$LogHelper.prototype */ {
        
        /**
         * 
         */
        label: function(t)
        {
            this.parts.push('[' + t + ']:');
        },
        
        /**
         * 
         */
        dump: function(o) {
            this.parts.push(raptor.require('debug').dumpToString(
                    arguments.length > 1 ?
                            arrayFromArguments(arguments) :
                            o));
        },
        
        /**
         * 
         */
        print: function(m)
        {
            this.parts.push(m);
        },    
        
        /**
         * 
         */
        toString: function()
        {
            return this.parts.join('\n');
        },
        
        /**
         * 
         */
        stackTrace: function()
        {
            if (stacktraces) {
                this.parts.push(stacktraces.get(-1));
            }
        }
    };
    
    /**
     * @extension Console
     */
    raptor.extendCore('logging', {
        /**
         * @type logging_Console$LogHelper
         */
        LogHelper: LogHelper,
        
        /**
         * 
         * @returns {logging_Console$LogHelper} A new log helper object
         */
        createLogHelper: function() {            
            return new this.LogHelper();
        }
    });

});