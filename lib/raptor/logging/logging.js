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
        ConsoleLogger = require('raptor/logging/ConsoleLogger'),
        levels = {
            'DEBUG': 0,
            'INFO': 1,
            'WARN': 2,
            'ERROR': 3,
            'FATAL': 4
        },
        loggers = [],
        configure = function(loggersConfig) {            
            if (!loggersConfig) {
                return;
            }
            
            var keys = objects.keys(loggersConfig);

            var sortByLen = function(a, b) {
                //Sort in ascending order (longest keys to shortest keys) with ROOT at the end
                var x = a === 'ROOT' ? 0 : a.length;
                var y = b === 'ROOT' ? 0 : b.length;
                return ((x > y) ? -1 : ((x < y) ? 1 : 0));
            };
            keys.sort(sortByLen);
            loggers = [];

            var i, len = keys.length, p, c;
            for (i=0; i<len; i++)
            {
                p = keys[i]; //Prefix
                c = objects.extend({}, loggersConfig[p]); //logger config

                c.prefix = p.replace(/\./g, '/');
                c.level = c.level != null ? levels[c.level.toUpperCase()] : 0;
                //if (console) console.debug('Logger: ' + p + ' - ' + c.level);

                loggers.push(c);
                //this.loggers.push();
            }
        },
        getLogLevel = function(className) {
            var i=0, len = loggers.length, c;
            for (; i<len; i++)
            {
                c = loggers[i];
                if (c.prefix === 'ROOT' || (c.prefix.length <= className.length && strings.startsWith(className, c.prefix)))
                {
                    return c.level;
                }
            }
            return -1;
        };

    configure({
        'ROOT': { level: "WARN" }
    });
    
     
    return {
        /**
         * @field
         * @private
         */
        levels: levels,
        /**
         * @function
         * @private
         */
        getLogLevel: getLogLevel,
        /**
         * @private
         * @returns {Array}
         */
        getLoggerConfigs: function() {
            return loggers;
        },
        /**
         * 
         * @param className
         * @returns
         */
        logger: function(className) {   
            var logLevel = getLogLevel(className);

            return logLevel === -1 ?
                this.voidLogger :
                new ConsoleLogger(logLevel, className);
        },
        

        /**
         * 
         */
        makeLogger: function(obj, className) {
            if (className == null) return;


            var logLevel = ConsoleLogger ? getLogLevel(className) : -1;
            var logClass = logLevel === -1 ? this.voidLogger : ConsoleLogger;
            
            objects.extend(obj, logClass.prototype);
            logClass.call(obj, logLevel, className);
        },
        
        configure: function(config) {
            configure(config.loggers);
        }
    };
});
