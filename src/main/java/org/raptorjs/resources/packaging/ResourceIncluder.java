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

package org.raptorjs.resources.packaging;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public abstract class ResourceIncluder {
    

    private PackageManager packageManager = null;
    private Map<String, DependencyResource> cachedResourceIncludes = new ConcurrentHashMap<String, DependencyResource>();
    private Map<String, Dependency> cachedModuleIncludes = new ConcurrentHashMap<String, Dependency>();
    
    public ResourceIncluder(PackageManager packageManager) {
        this.packageManager = packageManager;
    }

    

    public DependencyResource getResourceIncludeCached(String path, ContentType contentType) {
        DependencyResource include = this.cachedResourceIncludes.get(path);
        if (include == null) {
            include = this.packageManager.createResourceInclude(contentType, path);    
            this.cachedResourceIncludes.put(path, include);
        }
        
        return include;
    }
    
    public Dependency getModuleIncludeCached(String moduleName) {
        Dependency include = this.cachedModuleIncludes.get(moduleName);
        if (include == null) {
            Map<String, Object> properties = new HashMap<String, Object>();
            properties.put("name", moduleName);
            include = this.packageManager.createInclude("module", properties);    
            this.cachedModuleIncludes.put(moduleName, include);
        }
        
        return include;
    }
    
    public void includeModule(String moduleName, IncludeOptions includeOptions, ResourceIncluderContext context) {
        Dependency include = this.getModuleIncludeCached(moduleName);
        include.include(includeOptions, context);
    }
    
    public void clearCache() {
        this.cachedResourceIncludes.clear();
        this.cachedModuleIncludes.clear();
    }
    
}
