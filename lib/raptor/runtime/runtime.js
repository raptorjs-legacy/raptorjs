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

define('raptor/runtime', ['raptor'], function(raptor, require) {
    'use strict';
    
    var loadedFiles = {};
    
    return {
        evaluateResource : function(resource) {
            resource = require('raptor/resources').findResource(resource);
            if (resource.exists() === false)
            {
                throw raptor.createError(new Error('Resource not found: ' + resource.getPath()));
            }
            
            if (resource.isFileResource())
            {
                var filePath = resource.getFilePath();
                if (loadedFiles[filePath] !== true) {
                    this.require(filePath);
                    loadedFiles[filePath] = true;
                }
            }
            else
            {
                var source = resource.readAsString("UTF-8");
                this.evaluateString(source, resource.getURL());
            }
        }
    };    
});