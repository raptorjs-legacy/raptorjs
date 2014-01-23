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
define.Class('raptor/logging/Logger', function (require) {
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
    LogEvent.prototype.getLoggerName = function () {
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
    Logger.setLogging = function (val) {
        logging = val;
    };
    Logger.setLogLevel = function (val) {
        LogLevel = val;
    };
    Logger.prototype = {
        _loggerName: undefined,
        _level: undefined,
        _appenders: undefined,
        _update: function () {
            if (this._loggingModifiedFlag !== logging._modifiedFlag) {
                Logger.call(this, logging.getLoggerConfig(this._loggerName), this._loggerName, logging.getAppenders());
            }
        },
        getLevel: function () {
            this._update();
            return this._level;
        },
        isTraceEnabled: function () {
            this._update();
            return this._level === 0;
        },
        isDebugEnabled: function () {
            this._update();
            return this._level <= 1;
        },
        isInfoEnabled: function () {
            this._update();
            return this._level <= 2;
        },
        isWarnEnabled: function () {
            this._update();
            return this._level <= 3;
        },
        isErrorEnabled: function () {
            this._update();
            return this._level <= 4;
        },
        isFatalEnabled: function () {
            this._update();
            return this._level <= 5;
        },
        dump: function (obj, desc, allProps) {
            this._update();
            if (this._level > 1)
                return;
            for (var i = 0, len = this._appenders.length; i < len; i++) {
                var appender = this._appenders[i];
                if (appender && appender.dump) {
                    appender.dump(obj, desc, allProps);
                }
            }
        },
        trace: function (message, exception) {
            this._update();
            if (this._level > 0)
                return;
            this._log(new LogEvent(this, LogLevel.TRACE, arguments));
        },
        debug: function (message, exception) {
            this._update();
            if (this._level > 1)
                return;
            this._log(new LogEvent(this, LogLevel.DEBUG, arguments));
        },
        info: function (message, exception) {
            this._update();
            if (this._level > 2)
                return;
            this._log(new LogEvent(this, LogLevel.INFO, arguments));
        },
        warn: function (message, exception) {
            this._update();
            if (this._level > 3)
                return;
            this._log(new LogEvent(this, LogLevel.WARN, arguments));
        },
        error: function (message, exception) {
            this._update();
            if (this._level > 4)
                return;
            this._log(new LogEvent(this, LogLevel.ERROR, arguments));
        },
        fatal: function (message, exception) {
            this._update();
            if (this._level > 5)
                return;
            this._log(new LogEvent(this, LogLevel.FATAL, arguments));
        },
        _log: function (logEvent) {
            // loop through all of the appenders and have them log the event
            for (var i = 0, len = this._appenders.length; i < len; i++) {
                this._appenders[i].log(logEvent);
            }
        }
    };
    return Logger;
});