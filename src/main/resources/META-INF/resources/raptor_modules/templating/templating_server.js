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
        resources = raptor.require('resources'),
        files = raptor.require('files'),
        File = files.File;

    return {
        findTemplate: function(name) {
            var path = name,
                resource,
                templatePath,
                templateFile = new File(name);
            
            
            if (templateFile.exists() && templateFile.isFile()) {
                resource = resources.createFileResource(templateFile.getAbsolutePath());
            }
            else {
                templatePath = path;
                if (!strings.startsWith(templatePath, '/')) {
                    templatePath = '/' + templatePath;
                }
                
                if (!strings.endsWith(templatePath, '.rhtml')) {
                    templatePath += '.rhtml';
                }
                
                resource = resources.findResource(templatePath);
            }
            
            
            if (!resource || !resource.exists()) {
                templatePath = path;
                
                if (!strings.startsWith(templatePath, '/')) {
                    templatePath = '/' + templatePath;
                }
                
                var lastSlash = templatePath.lastIndexOf('/');
                if (lastSlash != -1) {
                    resource = resources.findResource(templatePath + templatePath.substring(lastSlash) + ".rhtml");
                }
            }
            
            if (resource && resource.exists()) {
                raptor.require('templating.compiler').compileAndLoadResource(resource, {templateName: name});
            }
        }
    };
});