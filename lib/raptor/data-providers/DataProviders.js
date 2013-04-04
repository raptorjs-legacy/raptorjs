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
 * The {@link raptor/render-context/Context} class represents a "rendering context"
 * suitable for rendering HTML to a writer. A context object is required when rendering 
 * a template and the context object contains a reference to an underlying writer object that is
 * used to capture the rendered output.
 */
define.Class(
    'raptor/data-providers/DataProviders',
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var forEachEntry = raptor.forEachEntry,
            promises = require('raptor/promises');
        
        var DataProviders = function(parent) {
            this.parent = parent;
            this.providers = {};
        };
        
        DataProviders.prototype = {
            register: function(name, func, thisObj) {
                if (typeof name === 'object') {
                    var providers = arguments[0],
                        thisObj = arguments[1];

                    forEachEntry(providers, function(name, func) {
                        this.register(name, func, thisObj);
                    }, this);

                    return;
                }

                this.providers[name] = [func, thisObj];
            },

            hasProvider: function(name) {
                return this.providers.hasOwnProperty(name) || 
                    (this.parent && this.parent.hasProvider(name));
            },

            requestData: function(name, args) {
                var provider = this.providers[name];
                if (!provider && this.parent) {
                    provider = this.parent.providers[name];
                }

                if (!provider) {
                    throw raptor.createError(new Error('Data provider not found for "' + name + '"'));
                }

                var deferred = promises.defer(),
                    func = provider[0],
                    thisObj = provider[1];

                func.call(thisObj, args, deferred);

                return deferred.promise;
            }
        };
        
        
        return DataProviders;
        
    });