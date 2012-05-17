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
    "use strict";
    
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