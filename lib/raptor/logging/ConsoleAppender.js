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

/**
 * This class servers a logger that sends all output to the "console" object (if it exists).
 *
 * @param {number} level The log level
 * @param {string} loggerName The logger name
 *
 */
define("raptor/logging/ConsoleAppender", function(require) {
    "use strict";


    function getStackTrace(error) {
        var stacktraces = require('raptor/stacktraces');
        return (stacktraces && stacktraces.trace) ? stacktraces.trace(error) : (error || '');
    }

    var ConsoleAppender = function() {
    };

    ConsoleAppender.prototype = {
        /**
         * Log statements for all levels pass through this method.
         */
        log: function(logEvent) {
            var logLevel = logEvent.logLevel;

            var logFn = console[logLevel.methodName] || console.log;
            if (!logFn) {
                return;
            }

            try {
                var args = logEvent.args;
                var len = args.length;
                var error;

                for (var i=0; i<len-1; i++) {
                    var arg = args[i];
                    if (arg instanceof Error) {
                        args[i] = getStackTrace(arg);
                    }
                }
                
                var lastArg = args[len-1];

                if (lastArg instanceof Error) {
                    error = lastArg;
                    args[len-1] = '';
                }

                var logArgs = [logLevel.name + " " + logEvent.getLoggerName() + ":"].concat(args);

                // log the message at the level specified
                logFn.apply(console, logArgs);

                if (error) {
                    logFn.call(console, error.stack || error);

                    var cause = error._cause;
                    while (cause) {
                        logFn.call(console, 'Caused by:');
                        logFn.call(console, cause.stack || cause);
                        cause = cause._cause;
                    }
                }

                if (logLevel.level === 0) {
                    if (console.trace) {
                        console.trace();
                    } else {
                        var stackTrace = getStackTrace();
                        if (stackTrace && console.log) {
                            console.log(stackTrace);
                        }
                    }
                }

            } catch (e) {
                logFn = console.error || logFn;
                logFn.call(console, e);
            }
        },

        /**
         * Log the contents of the given object at the DEBUG level.
         */
        dump: function(obj, desc, allProps) {
            if (console.debug) {
                console.log((desc ? 'DUMP ' + desc : 'DUMP') + ':');
                console.debug(obj);
            }
        }
    };

    return ConsoleAppender;

});