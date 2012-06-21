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
 * 
 * @extension Server
 * 
 */
raptor.extend('templating', function(raptor) {
    "use strict";
    
    var strings = raptor.require('strings'),
        resources = raptor.require('resources');

    return {
        findTemplate: function(name) {
            var path = name,
                resource;
            if (!strings.startsWith(path, '/')) {
                path = '/' + path;
            }
            
            if (!strings.endsWith(path, '.rhtml')) {
                path += '.rhtml';
            }
            
            resource = resources.findResource(path);
            if (resource.exists()) {
                raptor.require('templating.compiler').compileAndLoadResource(resource, {templateName: name});
            }
        }
    };
});