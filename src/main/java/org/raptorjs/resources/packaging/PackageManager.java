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

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.raptorjs.resources.Resource;
import org.raptorjs.resources.ResourceManager;


public class PackageManager {
    
    private Map<String, PackageManifest> cachedManifests = new ConcurrentHashMap<String, PackageManifest>();
    private PackageManifestJSONLoader loader = null;
    private ResourceManager resourceManager = null;
    private DependencyFactory includeFactory = null;
    
    public PackageManager(ResourceManager resourceManager, DependencyFactory includeFactory) {
        this.resourceManager = resourceManager;
        this.includeFactory = includeFactory;
        this.loader = new PackageManifestJSONLoader(includeFactory);
    }
    
    public PackageManifest getPackageManifestCached(String packagePath) {
        PackageManifest manifest = this.cachedManifests.get(packagePath);
        if (manifest == null) {
            Resource resource = this.resourceManager.findResource(packagePath);
            manifest = this.getPackageManifestCached(resource);
        }
        return manifest;
    }
    
    public PackageManifest getPackageManifestCached(Resource resource) {
        PackageManifest manifest = this.cachedManifests.get(resource.getPath());
        if (manifest == null) {            
            manifest = this.loadPackageManifest(resource);
            this.cachedManifests.put(resource.getPath(), manifest);
        }
        return manifest;
    }
    
    public void clearCache() {
        this.cachedManifests.clear();
    }
    
    public Dependency createInclude(String type, Map<String, Object> properties) {
        Dependency include = this.includeFactory.createInclude(type, properties);
        return include;
    }
    
    public DependencyResource createResourceInclude(ContentType type, String path) {
        
        DependencyResource include = this.includeFactory.createResourceInclude(type, path);
        return include;
    }
    
    public PackageManifest getModulePackageManifestCached(String moduleName) {
        PackageManifest manifest = this.cachedManifests.get(moduleName);
        if (manifest == null) {
            Resource resource = this.resourceManager.findResource("/" + moduleName.replace('.', '/') + "/package.json");
            if (resource == null) {
                resource = this.resourceManager.findResource("/" + moduleName.replace('.', '/') + "-package.json");
            }
            if (resource == null) {
                throw new RuntimeException("Package manifest not found for module \"" + moduleName + "\"");
            }
            
            manifest = this.getPackageManifestCached(resource);
            this.cachedManifests.put(moduleName, manifest);
        }
        return manifest;
    }
    
    protected PackageManifest loadPackageManifest(Resource resource) {
        
        try {
            PackageManifest manifest = this.loader.load(resource);
            
            return manifest;
        } catch (Exception e) {
            throw new RuntimeException("Unable to parse JSON file at path '" + resource.getSystemPath() + "'. Exception: " + e, e);
        }
    }
    
}
