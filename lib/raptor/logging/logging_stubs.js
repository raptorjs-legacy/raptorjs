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


define('raptor/logging', ['raptor'], function(raptor) {
    /*jshint strict:false */
    
    /**
     * @class
     * @name raptor/logging/VoidLogger
     */
    
    /**
     *
     */
    var EMPTY_FUNC = function() {
            return false;
        },
        /**
         * @name raptor/logging/voidLogger
         */
        voidLogger = {
            
            /**
             *
             */
            isTraceEnabled: EMPTY_FUNC,

            /**
             *
             */
            isDebugEnabled: EMPTY_FUNC,
            
            /**
             *
             */
            isInfoEnabled: EMPTY_FUNC,
            
            /**
             *
             */
            isWarnEnabled: EMPTY_FUNC,
            
            /**
             *
             */
            isErrorEnabled: EMPTY_FUNC,
            
            /**
             *
             */
            isFatalEnabled: EMPTY_FUNC,
            
            /**
             *
             */
            dump: EMPTY_FUNC,
            
            /**
             *
             */
            trace: EMPTY_FUNC,

            /**
             *
             */
            debug: EMPTY_FUNC,
            
            /**
             *
             */
            info: EMPTY_FUNC,
            
            /**
             *
             */
            warn: EMPTY_FUNC,
            
            /**
             *
             */
            error: EMPTY_FUNC,
            
            /**
             *
             */
            fatal: EMPTY_FUNC,
        };

    return {
        /**
         *
         * @param className
         * @returns
         */
        logger: function(className)
        {
            return voidLogger;
        },
        
        configure: EMPTY_FUNC,
        
        voidLogger: voidLogger
    };

});
