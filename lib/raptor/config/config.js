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

$rload(function(raptor) {
    "use strict";
    
    /**
     * @class
     * @name config.Config
     */
    var Config = function(properties) {
        this.properties = {};
        this.listeners = raptor.listeners.createObservable();
        
        if (properties) {
            this.add(properties);
        }
    };
    
    Config.prototype = {
        
        /**
         * Adds the provided properties to the configuration object. 
         * 
         * <p>The properties
         * should be provided as a map where the key is the property name and
         * the configuration for the corresponding property is provided as the value.
         * 
         * <p>
         * <config label="The following configuration options are supported for properties:">
         * <prop name="value" type="Object">The initial value for the property</prop>
         * <prop name="notify" type="Boolean">If notify === false then the onChange function will not be invoked for the initial value. Otherwise the listener will be invoked.</prop>
         * <prop name="onChange" type="Function">A function to invoke when the value of the property is changed. The new value is passed as the first argument and the old value is passed as the second argument. (optional)</prop>
         * <prop name="thisObj" type="Object">The "this" object to use for the onChange callback function. (optional)</prop>
         * </config>
         * 
         * <p>
         * Example:
         * <js>
         * config.add({
         *     "newProperty": {
         *         value: 200,
         *         onChange: function(newValue, oldValue) {
         *             //Do something when the value of the property changes
         *         }
         *     }
         * }, this);
         * </js>
         * @param properties {propertiesConfig} The properties to add as an object with keys as the property names and values as the property configurations. See above for description.
         * @param thisObj {Object} The "this" object to use for any of the "onChange" callbacks provided in the properties to be added. (optional)
         */
        add: function(properties, thisObj) {
            if (!thisObj) {
                thisObj = properties.thisObj;
            }
            
            delete properties.thisObj;
            
            raptor.forEachEntry(properties, function(name, property) {
                if (!property) {
                    
                }
                if (property.onChange)
                {
                    this.onChange(name, property.onChange, thisObj);
                }
                this.set(name, property.value, property.notify);
            }, this);
        },
        
        /**
         * Adds an "onChange" listener for the specified property.
         * 
         * @param name The name of the property.
         * @param callback
         * @param thisObj
         * @returns
         */
        onChange: function(name, callback, thisObj) {
            return this.listeners.subscribe(name, callback, thisObj);
        },
        
        /**
         * 
         * @param name
         * @param value
         * @param notify
         */
        set: function(name, value, notify) {
            var properties = this.properties;
            var oldValue = properties[name];
            
            if (oldValue !== value)
            {
                properties[name] = value;
                
                if (notify !== false) {
                    this.listeners.publish(name, [value, oldValue]);
                }
            }
        },
        
        /**
         * 
         * @param name
         * @returns
         */
        get: function(name) {
            return this.properties[name];
        },
        
        /**
         * 
         * @param name
         */
        remove: function(name) {
            
            var oldValue = this.properties[name];
            
            if (oldValue !== undefined)
            {
                this.listeners.publish(name, undefined, oldValue);
            }
        }
    };
    
    /**
     * Provides support for configuration objects with
     * properties that can have attached onChange listeners.
     * 
     * <p>
     * See {@link config.Config#add} for the format of the properties.
     * 
     * @namespace
     * @raptor
     * @name config
     */
    raptor.config = {
        /**
         * 
         * Creates a configuration object with the specified properties.
         * 
         * @param properties
         * @returns {config.Config}
         * @see {@link config.Config#add}
         */
        create: function(properties) {
            return new Config(properties);
        }
    };    
});