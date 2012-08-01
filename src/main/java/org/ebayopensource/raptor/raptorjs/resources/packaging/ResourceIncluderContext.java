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

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.ebayopensource.raptor.raptorjs.resources.ResourceManager;
import org.ebayopensource.raptor.raptorjs.rhino.RaptorJSEnv;
import org.mozilla.javascript.ScriptableObject;



public abstract class ResourceIncluderContext {
    private Map<String, PackageInclude> includedPackagesByPackagePath = new HashMap<String, PackageInclude>();
    private Map<String, AsyncInclude> includedAsyncRequiresByName = new HashMap<String, AsyncInclude>();
    
    private Set<Include> includedSet = new HashSet<Include>();
    
    private String defaultCssSlot = "head";
    private String defaultJsSlot = "body";
    private Set<String> defaultPackageExtensions = new HashSet<String>();

    private ResourceIncluder resourceIncluder = null;
    private PackageManager packageManager = null;
    private RaptorJSEnv raptorJSEnv = null;
    private ResourceManager resourceManager = null;
    
    
    public ResourceIncluderContext(ResourceIncluder resourceIncluder, PackageManager packageManager, RaptorJSEnv raptorJSEnv, ResourceManager resourceManager) {
        this.resourceIncluder = resourceIncluder;
        this.packageManager = packageManager;
        this.raptorJSEnv = raptorJSEnv;
        this.resourceManager = resourceManager;
    }
    
    
    
    public ScriptableObject getScriptableExtensionsCollection(IncludeOptions packageIncludeOptions) {
        return packageIncludeOptions.getScriptableExtensionsCollection(this.raptorJSEnv);
    }
    
    public void enableExtension(String extension) {
        defaultPackageExtensions.add(extension);
    }
    
    public void disableExtension(String extension) {
        defaultPackageExtensions.remove(extension);
    }
    
    
    
    public Set<String> getDefaultPackageExtensions() {
        return defaultPackageExtensions;
    }

    public boolean isExtensionEnabled(Extension extension, IncludeOptions packageIncludeOptions) {
        if (extension.hasCondition()) {
            return extension.checkCondition(this.raptorJSEnv, this.getScriptableExtensionsCollection(packageIncludeOptions));            
        }
        else {
            String[] extensionParts = extension.getName().split("\\s*[_\\-,|]\\s*");
            for (String extensionPart : extensionParts) {
                if (!(defaultPackageExtensions.contains(extensionPart) || (packageIncludeOptions != null && packageIncludeOptions.isModuleExtensionEnabled(extensionPart)))) {
                    return false; 
                }
            }
            return true;
        }
        
    }
    
    public boolean isPackageExtensionIncluded(PackageManifest manifest, Extension extension) {
        if (extension == null) {
            return this.includedPackagesByPackagePath.containsKey(manifest.getPackagePath());
        }
        
        PackageInclude packageInclude = includedPackagesByPackagePath.get(manifest.getPackagePath());
        if (packageInclude == null) {
            return false;
        }
        
        return packageInclude.isExtensionIncluded(extension);
    }
    
    public void setPackageExtensionIncluded(PackageManifest manifest, Extension extension) {

        PackageInclude packageInclude = includedPackagesByPackagePath.get(manifest.getPackagePath());
        if (packageInclude == null) {
            packageInclude = new PackageInclude();
            includedPackagesByPackagePath.put(manifest.getPackagePath(), packageInclude);
        }
        
        if (extension != null) {
            packageInclude.setExtensionIncluded(extension);    
        }
    }
    
    public boolean isAsyncPackageIncluded(String require) {
        return this.includedAsyncRequiresByName.containsKey(require);
    }

    public boolean isIncluded(Include include) {
        return this.includedSet.contains(include);
    }
    
    
    public void setIncluded(Include include) {
        this.includedSet.add(include);
    }
    
    public Set<String> getPackageExtensions() {
        return defaultPackageExtensions;
    }

    public ResourceIncluder getResourceIncluder() {
        return resourceIncluder;
    }
    
    public String getDefaultCssSlot() {
        return defaultCssSlot;
    }

    public void setDefaultCssSlot(String defaultCssSlot) {
        this.defaultCssSlot = defaultCssSlot;
    }

    public String getDefaultJsSlot() {
        return defaultJsSlot;
    }

    public void setDefaultJsSlot(String defaultJsSlot) {
        this.defaultJsSlot = defaultJsSlot;
    }
    
    public boolean isAsyncRequiresMetadataAvailable() {
        return this.includedAsyncRequiresByName != null && !this.includedAsyncRequiresByName.isEmpty();
    }
    
    public void includeAsyncPackage(String requireName, PackageManifest manifest, IncludeOptions includeOptions) {
        
        AsyncInclude asyncInclude = includedAsyncRequiresByName.get(requireName);
        if (asyncInclude == null) {
            asyncInclude = new AsyncInclude(requireName, manifest);
            includedAsyncRequiresByName.put(requireName, asyncInclude);
        }
        
        Set<String> enabledExtensions = includeOptions.getEnabledExtensions();
        if (enabledExtensions != null) {
            for(String extensionName : enabledExtensions) {
                asyncInclude.includeExtension(extensionName);
            }            
        }
    }
    
    public AsyncMetadata getAsyncMetadata() {
        AsyncMetadata metadata = new AsyncMetadata();
        
        for (Map.Entry<String, AsyncInclude> asyncRequireEntry : this.includedAsyncRequiresByName.entrySet()) {
            String requireName = asyncRequireEntry.getKey();
            AsyncInclude asyncInclude = asyncRequireEntry.getValue();
            PackageManifest packageManifest = asyncInclude.getPackageManifest();
            this.getAsyncMetadataJSONHelper(metadata, requireName, packageManifest, asyncInclude.getIncludedExtensions());
            
        }
        
        return metadata;
    }

    private void getAsyncMetadataJSONHelper(AsyncMetadata metadata, String requireName, PackageManifest packageManifest, Set<Extension> includedExtensions) {
        if (metadata.hasRequires(requireName)) {
            return; //This require has already been handled nothing to do
        }
        
        if (includedExtensions == null) {
            AsyncInclude asyncInclude = this.includedAsyncRequiresByName.get(requireName);
            if (asyncInclude != null) {
                includedExtensions = asyncInclude.getIncludedExtensions();
            }
        }
        
        
        List<String> requires = new LinkedList<String>();
        List<Include> jsIncludes = new LinkedList<Include>();
        List<Include> cssIncludes = new LinkedList<Include>();
        
        List<Include> includes = packageManifest.getIncludes();
        if (includes != null) {
            for (Include include : includes) {
                if (include.isPackageInclude()) {
                    IncludePackage packageInclude = (IncludePackage) include;
                    requires.add(packageInclude.getAsyncRequireName());
                    this.getAsyncMetadataJSONHelper(metadata, packageInclude.getAsyncRequireName(), packageInclude.getPackageManifest(this), null);
                }
                else {
                    IncludeResource resourceInclude = (IncludeResource) include;
                    if (resourceInclude.getContentType() == ContentType.JS) {
                        jsIncludes.add(include);
                    }
                    else {
                        cssIncludes.add(include);    
                    }
                    
                }
            }
        }
        
        
        List<Extension> extensions = packageManifest.getExtensions();
        if (extensions != null) {
            for (Extension extension : extensions) {
                
                if ((includedExtensions != null && includedExtensions.contains(extension)) || this.isExtensionEnabled(extension, null)) {
                    includes = packageManifest.getIncludes();
                    for (Include include : includes) {
                        if (include.isPackageInclude()) {
                            IncludePackage packageInclude = (IncludePackage) include;
                            requires.add(packageInclude.getAsyncRequireName());
                            this.getAsyncMetadataJSONHelper(metadata, packageInclude.getAsyncRequireName(), packageInclude.getPackageManifest(this), null);
                        }
                        else {
                            IncludeResource resourceInclude = (IncludeResource) include;
                            if (resourceInclude.getContentType() == ContentType.JS) {
                                jsIncludes.add(include);
                            }
                            else {
                                cssIncludes.add(include);    
                            }
                        }
                    }    
                }
            }
        }
        
        AsyncDependencies asyncDependencies = this.createAsyncDependencies(requires, jsIncludes, cssIncludes);
        String json = AsyncPackageJSONBuilder.getInstance().buildJSON(asyncDependencies);
        metadata.setRequiresJSON(requireName, json);
    }

    protected abstract AsyncDependencies createAsyncDependencies(List<String> requires, List<Include> jsIncludes, List<Include> cssIncludes);

    private static class PackageInclude {
        private Set<Extension> includedExtensions = new HashSet<Extension>();
        
        private PackageInclude() {
        }
        
        private void setExtensionIncluded(Extension extension) {
            this.includedExtensions.add(extension);
        }
        
        private boolean isExtensionIncluded(Extension extension) {
            return this.includedExtensions.contains(extension);
        }
    }



    public PackageManager getPackageManager() {
        return packageManager;
    }

    public RaptorJSEnv getRaptorJSEnv() {
        return raptorJSEnv;
    }

    public ResourceManager getResourceManager() {
        return resourceManager;
    }
    
    public static class AsyncInclude {
        private String requireName = null;
        private PackageManifest packageManifest = null;
        private Set<Extension> includedExtensions = new HashSet<Extension>();
        
        private AsyncInclude(String requireName, PackageManifest packageManifest) {
            this.requireName = requireName;
            this.packageManifest = packageManifest;
        }
        
        private void includeExtension(String name) {
            Extension extension = this.packageManifest.getExtension(name);
            includedExtensions.add(extension);
        }

        public String getRequireName() {
            return requireName;
        }

        public PackageManifest getPackageManifest() {
            return packageManifest;
        }

        public Set<Extension> getIncludedExtensions() {
            return includedExtensions;
        }
        
        
        
    }
    
}
