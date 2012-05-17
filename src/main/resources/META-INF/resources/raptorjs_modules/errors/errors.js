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
    
    var createError = function(message, cause) 
    {
        var error;

        if (arguments.length === 2)
        {
            error = message instanceof Error ? message : new Error(message);            
            error.__cause__ = cause;                        
        }
        else if (arguments.length === 1)
        {            
            if (message instanceof Error)
            {
                error = message;
            }
            else
            {
                error = new Error(message);                
            }
        }
        
        return error;
    };

    raptor.defineCore('errors', {
        
        /**
         * 
         * @param message
         * @param cause
         */
        throwError: function(message, cause)
        {
            var error = createError.apply(this, arguments);
            throw error;
        }
    });    
    
    raptor.throwError = raptor.errors.throwError;
});