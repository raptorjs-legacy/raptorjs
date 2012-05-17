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
    "packaging.include-handlers.IncludeHandler_rhtml",
    "packaging.IncludeHandler",
    function() {
        return {
            includeKey: function(include) {
                return "rhtml:" + include.path;
            },
            
            load: function(include, manifest) {
                var resource = manifest.resolveResource(include.path);
                var xmlSource = resource.readFully();
                raptor.require("templating.compiler").compileAndLoad(xmlSource, resource.getSystemPath());
            },
            
            aggregate: function(include, manifest, aggregator) {
                var resource = manifest.resolveResource(include.path);
                var xmlSource = resource.readFully();
                var rhtmlJs = raptor.require("templating.compiler").compile(xmlSource, resource.getSystemPath());
                aggregator.addJavaScriptCode(rhtmlJs, resource.getSystemPath());
            }
        };
    });
