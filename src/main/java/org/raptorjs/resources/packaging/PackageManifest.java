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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.raptorjs.resources.Resource;
import org.raptorjs.resources.ResourceManager;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PackageManifest {
    
    private String name = null;
    private Resource resource = null;    
    private Map<String, Extension> extensionsByName = new HashMap<String, Extension>();
    private List<Dependency> dependencies = new ArrayList<Dependency>();
    private List<Extension> extensions = new ArrayList<Extension>();
    
    public PackageManifest() {
    }
    
    public void addDependency(Dependency dependency) {

        this.dependencies.add(dependency);
    }
    
    public Extension getExtension(String name) {
        return this.extensionsByName.get(name);
    }
    
    public void addExtension(Extension extension) {
        this.extensions.add(extension);
        if (extension.getName() != null) {
            this.extensionsByName.put(extension.getName(), extension);
        }
    }
    //////////
    
    public String getSystemPath() {
        return this.resource.getURL();
    }

    
    public List<Dependency> getIncludes() {
        return this.dependencies;
    }
    
    public List<Extension> getExtensions() {
        return this.extensions;
    }

    
    public String getName() {
        return name;
    }
    
    public void setName(String moduleName) {
        this.name = moduleName;
    }

    public Resource getResource() {
        return resource;
    }

    public void setResource(Resource resource) {
        this.resource = resource;
    }

    @Override
    public String toString() {
        return "ModuleManifest [name=" + name + ", dependencies=" + this.dependencies + ", extensions=" + this.extensions + "]";
    }
    
    public Resource resolveResource(String path, ResourceManager resourceManager) {
        String fullPath = path.startsWith("/") ? 
                path :
                this.getModuleDirPath() + "/" + path;
        
        Resource resource = resourceManager.findResource(fullPath);
        if (resource == null) {
            throw new RuntimeException("Dependency with path '" + path + "' (" + fullPath + ") not found for packge '" + this.getPackagePath() + "'.");
        }
        return resource;
    }
    public String getModuleDirPath() {
        return this.resource.getParentPath();
    }


    public String getPackagePath() {
        return this.resource != null ? this.resource.getPath() : null;
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((name == null) ? 0 : name.hashCode());
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        PackageManifest other = (PackageManifest) obj;
        if (this.getSystemPath() == null) {
            if (other.getSystemPath() != null)
                return false;
        } else if (!getSystemPath().equals(other.getSystemPath()))
            return false;
        return true;
    }

    
}
