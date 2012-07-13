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
    
    var stacktraces = raptor.stacktraces;
    
    /**
     * @namespace
     * @raptor
     * @name errors
     */
    raptor.errors = /** @lends errors */ {        
        /**
         * 
         * @param message
         * @param cause
         */
        throwError: function(message, cause)
        {
            var output = '';
            
            var stackTrace = stacktraces.trace(message);
            if (stackTrace == null) {
                stackTrace = stacktraces.traceAndTrim(1);
            }
            if (message instanceof Error) {
                output += message + "\nStacktrace:\n" + stackTrace;
            }
            else {
                output += message;
            }
            
            if (cause) {
                output += "\n\nCaused by: ";
                
                if (cause instanceof Error) {
                    output += cause + "\nStacktrace:\n" + stacktraces.trace(cause);
                }
                else {
                    output += cause;
                }
            }
            
            output += "\n";
            
            throw new Error(output);
        }
    };  
    
    raptor.throwError = raptor.errors.throwError;
});