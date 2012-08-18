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
    
    var trim = function() {
        
    };
    
    /**
     * @namespace
     * @raptor
     * @name stacktraces
     */
    raptor.stacktraces = /** @lends stacktraces */{
        trace: function(e) {
            if (arguments.length === 1) {
                var rhinoException = e.rhinoException;
                if (rhinoException)
                {
                    if (rhinoException.getScriptStackTrace) {
                        return rhinoException.getScriptStackTrace();
                    }
                    else {
                        rhinoException.printStackTrace();
                    }
                }
                else {
                    return null;
                }
            }
            else if (arguments.length === 0){
                return this.traceAndTrim(1);
            }
        },
        
        traceAndTrim: function(trimCount) {
            trimCount++;
            
            var trace = '';
            
            try
            {
                this.triggerError();
            }
            catch(e) {
                trace = this.trace(e);
                var lines = trace.split("\n");
                if (lines.length >= trimCount) {
                    lines.splice(0, trimCount);
                }
                trace = lines.join("\n");
            }
            
            return trace;
            
        }
    };    
});