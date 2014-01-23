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
 * @extension Console
 */
define.extend('raptor/logging', function (require) {
    'use strict';
    var strings = require('raptor/strings');
    var Logger = require('raptor/logging/Logger');
    var logLevels = [
            'TRACE',
            'DEBUG',
            'INFO',
            'WARN',
            'ERROR',
            'FATAL',
            'OFF'
        ];
    var LogLevel = {};
    var _loggerConfigs;
    var _rootLoggerConfig;
    var _appenders = [];
    var loggerConfigsByName = {};
    var ConsoleAppender = require('raptor/logging/ConsoleAppender');
    function toLogLevel(logLevelName) {
        if (logLevelName && logLevelName.toUpperCase) {
            return LogLevel[logLevelName.toUpperCase()] || LogLevel.TRACE;
        } else {
            return LogLevel.TRACE;
        }
    }
    function createLogLevel(logLevel, index) {
        return {
            name: logLevel,
            level: index,
            methodName: logLevel.toLowerCase(),
            toString: function () {
                return logLevel;
            }
        };
    }
    function _configureLogger(loggerName, config) {
        var levelName;
        if (typeof config === 'string') {
            levelName = config;
        } else {
            levelName = config.levelName || config.level;
        }
        var loggerConfig = {
                levelName: levelName,
                loggerName: loggerName.replace(/\./g, '/'),
                logLevel: toLogLevel(levelName)
            };
        loggerConfigsByName[loggerName] = loggerConfig;
        if (loggerName === 'ROOT') {
            _rootLoggerConfig = loggerConfig;
        }
    }
    function loggerConfigComparator(a, b) {
        return b.loggerName.length - a.loggerName.length;
    }
    function _sortConfigs() {
        _loggerConfigs = [];
        for (var k in loggerConfigsByName) {
            if (loggerConfigsByName.hasOwnProperty(k)) {
                _loggerConfigs.push(loggerConfigsByName[k]);
            }
        }
        _loggerConfigs.sort(loggerConfigComparator);
    }
    for (var i = 0; i < logLevels.length; i++) {
        var logLevel = logLevels[i];
        LogLevel[logLevel] = createLogLevel(logLevel, i);
    }
    Logger.setLogLevel(LogLevel);
    var logging = {
            _modifiedFlag: 0,
            LogLevel: LogLevel,
            getLoggerConfig: function (loggerName) {
                var i = 0, len = _loggerConfigs.length, curLoggerConfig, curLoggerName;
                for (; i < len; i++) {
                    curLoggerConfig = _loggerConfigs[i];
                    curLoggerName = curLoggerConfig.loggerName;
                    if (strings.startsWith(loggerName, curLoggerName)) {
                        return curLoggerConfig;
                    }
                }
                return _rootLoggerConfig;
            },
            getLoggerConfigs: function () {
                return _loggerConfigs;
            },
            getAppenders: function () {
                return _appenders;
            },
            addAppender: function (appender) {
                _appenders.push(appender);
            },
            configureAppenders: function (appenders) {
                _appenders = appenders;
                logging._modifiedFlag++;
            },
            logger: function (loggerName) {
                return new Logger(this.getLoggerConfig(loggerName), loggerName, _appenders);
            },
            configureLogger: function (loggerName, config) {
                _configureLogger(loggerName, config);
                _sortConfigs();
                logging._modifiedFlag++;
            },
            configureLoggers: function (loggerConfigs) {
                var oldConfig = loggerConfigsByName;
                loggerConfigsByName = {};
                var rootFound = false;
                for (var k in loggerConfigs) {
                    if (loggerConfigs.hasOwnProperty(k)) {
                        if (k === 'ROOT') {
                            rootFound = true;
                        }
                        _configureLogger(k, loggerConfigs[k]);
                    }
                }
                if (!rootFound) {
                    _configureLogger('ROOT', 'WARN');
                }
                _sortConfigs();
                logging._modifiedFlag++;
                return oldConfig;
            },
            configure: function (config) {
                if (!config) {
                    return;
                }
                if (config.appenders) {
                    // configure appenders
                    this.configureAppenders(config.appenders);
                }
                if (config.loggers) {
                    // configure loggers
                    this.configureLoggers(config.loggers);
                }
            },
            ConsoleAppender: ConsoleAppender
        };
    Logger.setLogging(logging);
    logging.configure({ loggers: { 'ROOT': { level: 'WARN' } } });
    if (typeof console !== 'undefined') {
        logging.addAppender(new ConsoleAppender());
    }
    return logging;
});