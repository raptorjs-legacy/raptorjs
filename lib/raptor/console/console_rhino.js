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



(function() {
    "use strict";
    
    
    if (global.console === undefined) {
        global.console = {};
    }
    
    var console = global.console;
    
    var log = function() {
        var args = Array.prototype.slice.call(arguments);
        __rhinoHelpers.getConsole().log(args.join(", "));
    };
    
    var error = function() {
        var args = Array.prototype.slice.call(arguments);
        __rhinoHelpers.getConsole().error(args.join(", "));
    };
    
    if (console.log === undefined)
    {
        console.log = log;
    }
    
    if (console.debug === undefined)
    {
        console.debug = log;
    }
    
    if (console.info === undefined)
    {
        console.info = log;
    }

    if (console.warn === undefined)
    {
        console.warn = log;
    }

    if (console.error === undefined)
    {
        console.error = error;
    }

}());

