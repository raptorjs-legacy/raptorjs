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
define.extend('raptor/logging', function(require) {
    "use strict";

    var strings = require('raptor/strings'),
        objects = require('raptor/objects'),
        Logger = require('raptor/logging/Logger'),
        logLevels = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
        LogLevel = {},
        _loggerConfigs = undefined,
        _rootLoggerConfig = undefined,
        _appenders = [],
        toLogLevel = function(logLevelName) {
            if (logLevelName && logLevelName.toUpperCase) {
                return LogLevel[logLevelName.toUpperCase()] || LogLevel.TRACE;
            } else {
                return LogLevel.TRACE;
            }
        };

    function createLogLevel(logLevel) {
        return {
            name: logLevel,
            level: i,
            methodName: logLevel.toLowerCase(),
            toString: function() {
                return logLevel;
            }
        };
    }
    
    for (var i = 0; i < logLevels.length; i++) {
        var logLevel = logLevels[i];
        LogLevel[logLevel] = createLogLevel(logLevel);
    }

    var logging = {

        /**
         * enum type of all of the log levels
         */
        LogLevel: LogLevel,

        /**
         * @function
         * @private
         * @returns {Object} the configuration for the given logger
         */
        getLoggerConfig: function(loggerName) {
            var i = 0,
                len = _loggerConfigs.length,
                curLoggerConfig,
                curLoggerName;
            for (; i < len; i++) {
                curLoggerConfig = _loggerConfigs[i];
                curLoggerName = curLoggerConfig.loggerName;

                if (strings.startsWith(loggerName, curLoggerName)) {
                    return curLoggerConfig;
                }
            }

            return _rootLoggerConfig;
        },

        /**
         * @private
         * @returns {Array}
         */
        getLoggerConfigs: function() {
            return _loggerConfigs.concat(_rootLoggerConfig);
        },

        /**
         * @private
         * @returns {Array}
         */
        getAppenders: function() {
            return _appenders;
        },

        /**
         * Add an appender that will be used by all loggers
         */
        addAppender: function(appender) {
            _appenders.push(appender);
        },

        /**
         * Configures the appenders that will be used by the logging subsystem. The given appenders
         * will replace any existing appenders.
         */
        configureAppenders: function(appenders) {
            _appenders = appenders;
        },

        /**
         * @param loggerName name of the logger (e.g. "raptor/packaging")

         * @returns a new Logger for the given logger name
         */
        logger: function(loggerName) {
            var loggerConfig = this.getLoggerConfig(loggerName);
            if (loggerConfig === null) {
                // use voidLogger provided by logging_stubs
                return this.voidLogger;
            }

            return new Logger(this, loggerConfig.logLevel.level, loggerName, _appenders);
        },

        /**
         * Configures the logging subsystem with the given loggers (which will replace any existing loggers).
         *
         * Example logger configuration:
         * {
         *     'raptor': {
         *         level: 'INFO'
         *     },
         *     'raptor/packaging': {
         *         level: 'DEBUG'
         *     }
         * }
         *
         * @param loggers an object whose keys are the names of loggers and whose values are the configuration for that logger
         */
        configureLoggers: function(loggers) {

            var root = loggers.ROOT;
            if (root) {
                // pull out the ROOT logger config because it is special
                _rootLoggerConfig = root;
                _rootLoggerConfig.loggerName = 'ROOT';
                _rootLoggerConfig.logLevel = toLogLevel(root.level);
                delete _rootLoggerConfig.level;
                delete loggers.ROOT;
            }

            _loggerConfigs = [];

            var loggerNames = objects.keys(loggers);

            var loggerNameSort = function(a, b) {
                // Sort logger names in descending order by string length
                return b.length - a.length;
            };

            loggerNames.sort(loggerNameSort);

            var i, len = loggerNames.length,
                loggerName,
                loggerConfig;

            for (i = 0; i < len; i++) {
                loggerName = loggerNames[i];
                loggerConfig = loggers[loggerName];

                // normalize names of loggers by replacing each period with a forward slash
                loggerConfig.loggerName = loggerName.replace(/\./g, '/');

                // initialize the logLevel to be a valid LogLevel
                loggerConfig.logLevel = toLogLevel(loggerConfig.level);

                // remove the provided "level" property since we'll be using our own "logLevel" property
                delete loggerConfig.level;

                _loggerConfigs.push(loggerConfig);
            }
        },

        /**
         * This method will configure the logging subsystem. It typically should only be called once in application code.
         *
         * If the given config parameter contains a "loggers" property then the value of this property will be used
         * to replace the configuration for any existing loggers.
         *
         * If the given config parameter contains an "appenders" property then the value of this property will be used
         * to replace the configuration for any existing appenders.
         *
         * @param config the configuration object
         */
        configure: function(config) {
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
    };

    logging.configure({
        loggers: {
            'ROOT': {
                level: 'WARN'
            }
        }
    });

    if (typeof console !== 'undefined') {
        var ConsoleAppender = require('raptor/logging/ConsoleAppender');
        logging.addAppender(new ConsoleAppender());
    }

    return logging;
});