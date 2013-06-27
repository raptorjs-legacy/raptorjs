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

    var ConsoleAppender = function() {
    };


    ConsoleAppender.prototype = {

        /**
         * Log statements for all levels pass through this method.
         */
        log: function(logEvent) {
            var logLevel = logEvent.logLevel;

            if (logLevel.level === 0) {
                // TRACE is a little special
                this._trace(logEvent);
                return
            }

            var logFn = console[logLevel.methodName] || console.log;
            if (!logFn) {
                return;
            }

            try {
                var out = logLevel.name + " " + logEvent.getLoggerName() + ": " + (logEvent.message || ''),
                    error = logLevel.error,
                    stackTrace = logEvent.getStackTrace();

                // log the message at the level specified
                logFn.call(console, out);

                if (stackTrace) {
                    // output the stack trace
                    logFn.call(console, '\n\n' + stackTrace);
                } else if (error) {
                    // no stack trace but there is an error so output the error
                    logFn = console.error || logFn;
                    logFn.call(console, error);

                    var cause = error._cause;
                    while (cause) {
                        logFn.call(console, 'Caused by:');
                        logFn.call(console, cause);
                        cause = cause._cause;
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
        },

        /**
         * Special handling for logging an event at the trace level
         * @private
         */
        _trace: function(logEvent) {
            var message = logEvent.message;
            if (console.log && message) {
                console.log(message);
            }
            if (console.trace) {
                console.trace();
            } else {
                var stackTrace = logEvent.getStackTrace();
                if (stackTrace && console.log) {
                    console.log(stackTrace);
                }
            }
        }
    };

    return ConsoleAppender;

});