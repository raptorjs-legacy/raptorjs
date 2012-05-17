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

raptor.defineClass(
    "packaging.include-handlers.IncludeHandler_js",
    "packaging.IncludeHandler",
    function() {
        var loaded = {},
            runtime = raptor.require('runtime');
        
        return {
            includeKey: function(include) {
                return "js:" + include.path;
            },
            
            load: function(include, manifest, loader) {
                var resource = manifest.resolveResource(include.path),
                path = resource.getSystemPath();
                
                
                
                if (loader.isLoaded(path)) {
                    return;
                }
                
                loader.setLoaded(path);
                
                runtime.evaluateResource(resource);
            },
            
            aggregate: function(include, manifest, aggregator) {
                var resource = manifest.resolveResource(include.path);
                aggregator.addResourceCode("js", resource);
            }
        };
    });
