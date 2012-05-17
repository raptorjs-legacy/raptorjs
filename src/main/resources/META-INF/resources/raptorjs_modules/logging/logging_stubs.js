/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


$rload(function(raptor) {

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
