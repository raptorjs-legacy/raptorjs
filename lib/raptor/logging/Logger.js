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
    'use strict';

    var logging;
    var LogLevel;
    var slice = [].slice;
    
    function LogEvent(logger, logLevel, args) {
        this.logger = logger;
        this.logLevel = logLevel;
        this.args = slice.call(args);
    }

    /**
     * @returns {String} name of the logger associated with the log event
     */
    LogEvent.prototype.getLoggerName = function() {
        return this.logger._loggerName;
    };

    function Logger(loggerConfig, loggerName, appenders) {
        this._loggingModifiedFlag = logging._modifiedFlag;

        // name of this logger
        this._loggerName = loggerName;

        // numeric log level
        this._level = loggerConfig.logLevel.level;

        this._appenders = appenders;
    }

    Logger.setLogging = function(val) {
        logging = val;
    };

    Logger.setLogLevel = function(val) {
        LogLevel = val;
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

        _update: function() {
            if (this._loggingModifiedFlag !== logging._modifiedFlag) {
                Logger.call(
                    this, 
                    logging.getLoggerConfig(this._loggerName), 
                    this._loggerName, 
                    logging.getAppenders());
            }
        },

        /**
         * @return the numerical log level (0=TRACE to 5=FATAL)
         */
        getLevel: function() {
            this._update();
            return this._level;
        },

        /**
         * @returns true if TRACE log level is enabled, otherwise, return false
         */
        isTraceEnabled: function() {
            this._update();
            return this._level === 0;
        },

        /**
         * @returns true if DEBUG log level is enabled, otherwise, return false
         */
        isDebugEnabled: function() {
            this._update();
            return this._level <= 1;
        },

        /**
         * @returns true if INFO log level is enabled, otherwise, return false
         */
        isInfoEnabled: function() {
            this._update();
            return this._level <= 2;
        },

        /**
         * @returns true if WARN log level is enabled, otherwise, return false
         */
        isWarnEnabled: function() {
            this._update();
            return this._level <= 3;
        },

        /**
         * @returns true if ERROR log level is enabled, otherwise, return false
         */
        isErrorEnabled: function() {
            this._update();
            return this._level <= 4;
        },

        /**
         * @returns true if FATAL log level is enabled, otherwise, return false
         */
        isFatalEnabled: function() {
            this._update();
            return this._level <= 5;
        },

        /**
         * Log the contents of the given object at the DEBUG level.
         */
        //  Derived classes can arrive to handle object dumps better
        dump: function(obj, desc, allProps) {
            this._update();
            if (this._level > 1) return;
            for (var i = 0, len = this._appenders.length; i < len; i++) {
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
            this._update();
            if (this._level > 0) return;
            this._log(new LogEvent(this, LogLevel.TRACE, arguments));
        },

        /**
         * Log at DEBUG level
         */
        debug: function(message, exception) {
            this._update();
            if (this._level > 1) return;
            this._log(new LogEvent(this, LogLevel.DEBUG, arguments));
        },

        /**
         * Log at INFO level
         */
        info: function(message, exception) {
            this._update();
            if (this._level > 2) return;
            this._log(new LogEvent(this, LogLevel.INFO, arguments));
        },

        /**
         * Log at WARN level
         */
        warn: function(message, exception) {
            this._update();
            if (this._level > 3) return;
            this._log(new LogEvent(this, LogLevel.WARN, arguments));
        },

        /**
         * Log at ERROR level
         */
        error: function(message, exception) {
            this._update();
            if (this._level > 4) return;
            this._log(new LogEvent(this, LogLevel.ERROR, arguments));
        },

        /**
         * Log at FATAL level
         */
        fatal: function(message, exception) {
            this._update();
            if (this._level > 5) return;
            this._log(new LogEvent(this, LogLevel.FATAL, arguments));
        },

        /**
         * Derived classes must implement
         */
        _log: function(logEvent) {
            // loop through all of the appenders and have them log the event
            for (var i = 0, len = this._appenders.length; i < len; i++) {
                this._appenders[i].log(logEvent);
            }
        }
    };

    return Logger;

});