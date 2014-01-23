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
 * Provides support for configuration objects with
 * properties that can have attached onChange listeners.
 * 
 * <p>
 * See {@link raptor/config/Config#add} for the format of the properties.
 */
define('raptor/config', function (require) {
    'use strict';
    /**
     * @class
     * @anonymous
     * @name raptor/configConfig
     */
    var Config = function (properties) {
        this.properties = {};
        this.listeners = require('raptor/listeners').createObservable();
        if (properties) {
            this.add(properties);
        }
    };
    Config.prototype = {
        add: function (properties, thisObj) {
            if (!thisObj) {
                thisObj = properties.thisObj;
            }
            delete properties.thisObj;
            for (var name in properties) {
                if (properties.hasOwnProperty(name)) {
                    var property = properties[name];
                    if (property.onChange) {
                        this.onChange(name, property.onChange, thisObj);
                    }
                    this.set(name, property.value, property.notify);
                }
            }
        },
        onChange: function (name, callback, thisObj) {
            return this.listeners.subscribe(name, callback, thisObj);
        },
        set: function (name, value, notify) {
            var properties = this.properties;
            var oldValue = properties[name];
            if (oldValue !== value) {
                properties[name] = value;
                if (notify !== false) {
                    this.listeners.publish(name, [
                        value,
                        oldValue
                    ]);
                }
            }
        },
        get: function (name) {
            return this.properties[name];
        },
        remove: function (name) {
            var oldValue = this.properties[name];
            if (oldValue !== undefined) {
                this.listeners.publish(name, undefined, oldValue);
            }
        }
    };
    return {
        create: function (properties) {
            return new Config(properties);
        }
    };
});