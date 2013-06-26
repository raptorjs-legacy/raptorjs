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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    
    private void forEachDependencyHelper(PackageManifest packageManifest, IncludeOptions includeOptions, ResourceIncluderContext context, DependencyCallback callback, Set<Dependency> foundDependencies) {
        List<Dependency> dependencies = packageManifest.getDependencies();
        if (dependencies != null) {
            for (Dependency dependency : dependencies) {
                if (foundDependencies.contains(dependency)) {
                    continue;
                }
                
                if (dependency.isPackageInclude()) {
                    DependencyPackage packageInclude = (DependencyPackage) dependency;
                    PackageManifest childManifest = packageInclude.getPackageManifest(context);
                    forEachDependencyHelper(childManifest, includeOptions, context, callback, foundDependencies);
                }
                else {
                    callback.dependency(dependency);
                }
            }
        }
        
        List<Extension> extensions = packageManifest.getExtensions();
        if (extensions != null) {
            for (Extension extension : extensions) {
                
                if (context.isExtensionEnabled(extension, includeOptions)) {
                    dependencies = extension.getDependencies();
                    for (Dependency dependency : dependencies) {
                        if (foundDependencies.contains(dependency)) {
                            continue;
                        }
                        
                        if (dependency.isPackageInclude()) {
                            DependencyPackage packageInclude = (DependencyPackage) dependency;
                            PackageManifest childManifest = packageInclude.getPackageManifest(context);
                            forEachDependencyHelper(childManifest, includeOptions, context, callback, foundDependencies);
                        }
                        else {
                            callback.dependency(dependency);
                        }
                    }    
                }
            }
        }
    }
    
    public void forEachDependency(PackageManifest packageManifest, IncludeOptions includeOptions, ResourceIncluderContext context, DependencyCallback callback) {

        Set<Dependency> foundDependencies = new HashSet<Dependency>();
        forEachDependencyHelper(packageManifest, includeOptions, context, callback, foundDependencies);        
    }
    
}
