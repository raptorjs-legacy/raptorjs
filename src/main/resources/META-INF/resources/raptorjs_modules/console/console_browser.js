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
    
    if (!window.console)
    {
        var console = {};
        window.console = console;
        
        var logFunction = window.opera ? 
                function() { window.opera.postError(arguments); } : 
                function() {};
                
        raptor.forEach(
                ['log', 
                 'debug', 
                 'info', 
                 'warn', 
                 'error', 
                 'assert', 
                 'dir', 
                 'dirxml', 
                 'group', 
                 'groupEnd',
                 'time', 
                 'timeEnd', 
                 'count', 
                 'trace', 
                 'profile', 
                 'profileEnd'],
             function(name) {
                    console[name] = logFunction;
             });
    }
});
