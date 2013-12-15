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
 * @extension Browser
 */
define.extend('raptor/resources', function(require) {
    'use strict';
    
    var Resource = require('raptor/resources/Resource'),
        MissingResource = require('raptor/resources/MissingResource'),
        BrowserResource = require('raptor/resources/BrowserResource');
    
    return {
        /**
         *
         * @param path
         * @returns
         */
        findResource: function(path) {
            if (path instanceof Resource) {
                return path;
            }
            
            var contents = $rget('resource', path);
            if (contents) {
                return new BrowserResource(null, path, contents);
            }
            else {
                return new MissingResource(path);
            }
        }
    };
});
