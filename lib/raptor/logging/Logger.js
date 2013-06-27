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
 * Base class for loggers
 *
 * @param {number} level The log level
 * @param {string} loggerName The logger name
 *
 */
define.Class("raptor/logging/Logger", function(require) {
    "use strict";

    var LogEvent = function(logger, logLevel, message, exception) {
        this.logger = logger;
        this.logLevel = logLevel;
        this.message = message;

        if (this.exception) {
            this.error = this.exception;
        } else if (message instanceof Error) {
            this.error = message;
        }
    }

    /**
     * @returns {String} name of the logger associated with the log event
     */
    LogEvent.prototype.getLoggerName = function() {
        return this.logger._loggerName;
    }

    /**
     * @returns the string representation of the stack trace associated with the log even
     * if available
     */
    LogEvent.prototype.getStackTrace = function() {
        if (!this.error) {
            return null;
        }

        var stacktraces = require('raptor/stacktraces');
        return (stacktraces && stacktraces.trace) ? stacktraces.trace(this.error) : null;
    }

    var Logger = function(logging, level, loggerName, appenders) {

        // name of this logger
        this._loggerName = loggerName;

        // numeric log level
        this._level = level;

        // appenders logger will use
        this._appenders = appenders;

        this.LogLevel = logging.LogLevel;
    };

    Logger.prototype = {

        /**
         * Name of the logger (e.g. "raptor/packaging")

         * @field
         * @private
         */
        _loggerName: undefined,

        /**
         * Numeric log level

         * @field
         * @private
         */
        _level: undefined,

        /**
         * The appenders bound to this log level

         * @field
         * @private
         */
        _appenders: undefined,

        /**
         * @returns true if TRACE log level is enabled, otherwise, return false
         */
        isTraceEnabled: function() {
            return this._level === 0;
        },

        /**
         * @returns true if DEBUG log level is enabled, otherwise, return false
         */
        isDebugEnabled: function() {
            return this._level <= 1;
        },

        /**
         * @returns true if INFO log level is enabled, otherwise, return false
         */
        isInfoEnabled: function() {
            return this._level <= 2;
        },

        /**
         * @returns true if WARN log level is enabled, otherwise, return false
         */
        isWarnEnabled: function() {
            return this._level <= 3;
        },

        /**
         * @returns true if ERROR log level is enabled, otherwise, return false
         */
        isErrorEnabled: function() {
            return this._level <= 4;
        },

        /**
         * @returns true if FATAL log level is enabled, otherwise, return false
         */
        isFatalEnabled: function() {
            return this._level <= 5;
        },

        /**
         * Log the contents of the given object at the DEBUG level.
         */
        //  Derived classes can arrive to handle object dumps better
        dump: function(obj, desc, allProps) {
            if (this._level > 1) return;
            for (var i = 0; i < this._appenders.length; i++) {
                var appender = this._appenders[i];
                if (appender && appender.dump) {
                    appender.dump(obj, desc, allProps);
                }
            }
        },

        /**
         * Log at TRACE level
         */
        trace: function(message, exception) {
            if (this._level > 0) return;
            this._log(new LogEvent(this, this.LogLevel.TRACE, message, exception));
        },

        /**
         * Log at DEBUG level
         */
        debug: function(message, exception) {
            if (this._level > 1) return;
            this._log(new LogEvent(this, this.LogLevel.DEBUG, message, exception));
        },

        /**
         * Log at INFO level
         */
        info: function(message, exception) {
            if (this._level > 2) return;
            this._log(new LogEvent(this, this.LogLevel.INFO, message, exception));
        },

        /**
         * Log at WARN level
         */
        warn: function(message, exception) {
            if (this._level > 3) return;
            this._log(new LogEvent(this, this.LogLevel.WARN, message, exception));
        },

        /**
         * Log at ERROR level
         */
        error: function(message, exception) {
            if (this._level > 4) return;
            this._log(new LogEvent(this, this.LogLevel.ERROR, message, exception));
        },

        /**
         * Log at FATAL level
         */
        fatal: function(message, exception) {
            if (this._level > 5) return;
            this._log(new LogEvent(this, this.LogLevel.FATAL, message, exception));
        },

        /**
         * Derived classes must implement
         */
        _log: function(logEvent) {
            // loop through all of the appenders and have them log the event
            for (var i = 0; i < this._appenders.length; i++) {
                this._appenders[i].log(logEvent);
            }
        }
    };

    return Logger;

});