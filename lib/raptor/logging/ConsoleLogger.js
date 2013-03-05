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
define("raptor/logging/ConsoleLogger", function(require) {
    "use strict";
    
    var stacktraces = require('raptor/stacktraces');
    

    var ConsoleLogger = function(level, loggerName) {
        this._loggerName = loggerName;
        this._logLevel = level;
    };

    
    ConsoleLogger.prototype = {
        
        /**
         * 
         */
        isDebugEnabled: function()
        {
            return this._logLevel === 0;
        },
        
        /**
         * 
         */
        isInfoEnabled: function()
        {
            return this._logLevel <= 1;
        },
        
        /**
         * 
         */
        isWarnEnabled: function()
        {
            return this._logLevel <= 2;
        },
        
        /**
         * 
         */
        isErrorEnabled: function()
        {
            return this._logLevel <= 3;
        },
        
        /**
         * 
         */
        isFatalEnabled: function()
        {
            return this._logLevel <= 4;
        },
        
        /**
         * 
         */
        dump: function(obj, desc, allProps)
        {
            if (!this.isDebugEnabled()) return;
            
            if (desc)
            {
                desc = 'Object dump (' + desc + '):';
            }
            else
            {
                desc = 'Object dump:';
            }
            
            this._log('debug', [desc]);
            if (typeof console !== 'undefined' && console.debug)
            {
                console.debug(obj);
            }
        },
        
        /**
         * 
         */
        debug: function(message, exception)
        {
            if (!this.isDebugEnabled()) return;
            this._log('debug', message, exception);
        },
        
        /**
         * 
         */
        info: function(message, exception)
        {
            if (!this.isInfoEnabled()) return;
            this._log('info', message, exception);
        },
        
        /**
         * 
         */
        warn: function(message, exception)
        {
            if (!this.isWarnEnabled()) return;
            this._log('warn', message, exception);
        },
        
        /**
         * 
         */
        error: function(message, exception, includeStackTrace)
        {
            
            
            if (!this.isErrorEnabled()) return;
            this._log('error', message, exception, includeStackTrace !== false);
        },
        
        /**
         * 
         */
        fatal: function(message, exception)
        {
            if (!this.isFatalEnabled()) return;
            this._log('fatal', message, exception, true);
        },
        
        /**
         * 
         */
        _log: function(level, message, exception, includeStackTrace)
        {
            if (typeof console !== 'undefined' && console[level])
            {
                

                try
                {
                    
                    var out = level.toUpperCase() + " " + this._loggerName + ": " + ( message != null ? message : ''),
                        error;

                    if (exception != null)
                    {
                        error = exception;
                        if (stacktraces && stacktraces.trace) {
                            out += '\n\n' + stacktraces.trace(exception);
                        }
                    }
                    else if (message instanceof Error)
                    {
                        error = message;
                        if (stacktraces && stacktraces.trace) {
                            out += '\n\n' + stacktraces.trace(message);    
                        }
                    }
                    
                    console[level](out);

                    if (error && (!stacktraces || !stacktraces.trace)) {
                        console.error(error);
                    }
                                  
                }
                catch(e) {
                    console.error(e);
                }
            }
        },
        
        /**
         * 
         */
        trace: function(message)
        {
            if (this.isDebugEnabled())
            {
                if (typeof console !== 'undefined' && console.trace)
                {
                    if (message)
                    {
                        this.debug(message);
                    }
                    console.trace();
                }
                else
                {
                    var stackTrace = stacktraces ? stacktraces.trace() : "(stack trace not available)";
                    this.debug((message ? message + "\n": "") + stackTrace);
                }
            }
        }
    };
    
    return ConsoleLogger;

});