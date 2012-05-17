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

package org.ebayopensource.raptor.raptorjs.resources.packaging;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.codehaus.jackson.map.DeserializationConfig;
import org.codehaus.jackson.map.ObjectMapper;
import org.ebayopensource.raptor.raptorjs.resources.Resource;
import org.ebayopensource.raptor.raptorjs.resources.ResourceManager;
import org.ebayopensource.raptor.raptorjs.rhino.RaptorJSEnv;


public class PackageManager {
    
    private Map<String, PackageManifest> cachedManifests = new ConcurrentHashMap<String, PackageManifest>();

    private ObjectMapper mapper = new ObjectMapper();
    private RaptorJSEnv raptorJSEnv = null;
    
    public PackageManager(RaptorJSEnv raptorJSEnv) {
        this.raptorJSEnv = raptorJSEnv;
        mapper.configure(DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }
    
    public PackageManifest getCachedPackageManifest(String packagePath) {
        PackageManifest manifest = this.cachedManifests.get(packagePath);
        if (manifest == null) {
            manifest = this.loadPackageManifest(packagePath);
            this.cachedManifests.put(packagePath, manifest);
        }
        return manifest;
    }
    
    protected PackageManifest loadPackageManifest(String packagePath) {
        
        Resource resource = ResourceManager.getInstance().findResource(packagePath);
        if (resource == null) {
            throw new RuntimeException("Package manifest not found with path '" + packagePath + "'.");
        }
        
        PackageManifest manifest = this.loadPackageManifest(resource);
        return manifest;
    }
    
    protected PackageManifest loadPackageManifest(Resource resource) {
        
        String packageJsonPath = resource.getPath();
        String moduleDirPath = resource.getPath().substring(0, resource.getPath().lastIndexOf('/'));
        
        try {
            PackageManifest manifest = mapper.readValue(resource.getResourceAsStream(), PackageManifest.class);
            manifest.setPackagePath(packageJsonPath);
            manifest.init(this.raptorJSEnv);
            manifest.setModuleDirPath(moduleDirPath);
            return manifest;
        } catch (Exception e) {
            throw new RuntimeException("Unable to parse JSON file at path '" + resource.getSystemPath() + "'. Exception: " + e, e);
        }
    }
    
}
