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
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.raptorjs.resources.ResourceManager;
import org.raptorjs.rhino.RaptorJSEnv;



public abstract class ResourceIncluderContext {
    private Map<String, PackageInclude> includedPackagesByPackagePath = new HashMap<String, PackageInclude>();
    private Map<String, AsyncInclude> includedAsyncRequiresByName = new HashMap<String, AsyncInclude>();
    
    private Set<Dependency> includedSet = new HashSet<Dependency>();
    
    private String defaultCssSlot = "head";
    private String defaultJsSlot = "body";
    private Set<String> defaultPackageExtensions = new HashSet<String>();

    private ResourceIncluder resourceIncluder = null;
    private PackageManager packageManager = null;
    private RaptorJSEnv raptorJSEnv = null;
    private ResourceManager resourceManager = null;
    private ScriptableObject defaultScriptableExtensionsCollection = null;
    private Scriptable packagingModule = null;
    
    public ResourceIncluderContext(ResourceIncluder resourceIncluder, PackageManager packageManager, RaptorJSEnv raptorJSEnv, ResourceManager resourceManager) {
        this.resourceIncluder = resourceIncluder;
        this.packageManager = packageManager;
        this.raptorJSEnv = raptorJSEnv;
        this.resourceManager = resourceManager;
    }
    
    
    
    public ScriptableObject getScriptableExtensionsCollection(IncludeOptions packageIncludeOptions) {
    	if (packageIncludeOptions == null || !packageIncludeOptions.hasEnabledExtensions()) {
    		//There are no include-specific extensions... just use the default extension collection (create it if necessary)
    		if (this.defaultScriptableExtensionsCollection == null) {
    			this.defaultScriptableExtensionsCollection = this.createExtensionsCollection(defaultPackageExtensions);
    		}
    		return this.defaultScriptableExtensionsCollection;
    	}
    	else {
    		//Build the extension collection object from the enabled extensions provided in the include options and the default extensions
    		Set<String> enabledExtensions = new HashSet<String>(packageIncludeOptions.getEnabledExtensions());
    		enabledExtensions.addAll(defaultPackageExtensions);
    		return this.createExtensionsCollection(enabledExtensions);
    	}
    }
    
    protected ScriptableObject createExtensionsCollection(Set<String> enabledExtensions) {
    	Scriptable packaging = this.getPackagingModule();
    	ScriptableObject scriptableExtensionsCollection = (ScriptableObject) raptorJSEnv.getJavaScriptEngine().invokeMethod(packaging, "rhinoCreateExtensions", raptorJSEnv.getJavaScriptEngine().javaToJS(enabledExtensions));
    	return scriptableExtensionsCollection;
    }
    
    protected Scriptable getPackagingModule() {
    	if (this.packagingModule == null) {
    		this.packagingModule = raptorJSEnv.require("raptor/packaging");
    	}
    	return this.packagingModule;
    }
    
    public void enableExtension(String extension) {
    	this.defaultScriptableExtensionsCollection = null; //Invalidate the old extension collection object
        defaultPackageExtensions.add(extension);
    }
    
    public void disableExtension(String extension) {
    	this.defaultScriptableExtensionsCollection = null; //Invalidate the old extension collection object
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
            String[] extensionParts = extension.getName().split("\\s*[,|]\\s*");
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

    public boolean isIncluded(Dependency include) {
        return this.includedSet.contains(include);
    }
    
    
    public void setIncluded(Dependency include) {
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
    
    public void clearAsyncMetadata() {
    	this.includedAsyncRequiresByName = new HashMap<String, AsyncInclude>();
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
        List<Dependency> jsIncludes = new LinkedList<Dependency>();
        List<Dependency> cssIncludes = new LinkedList<Dependency>();
        
        List<Dependency> dependencies = packageManifest.getDependencies();
        if (dependencies != null) {
            for (Dependency include : dependencies) {
                if (include.isPackageInclude()) {
                    DependencyPackage packageInclude = (DependencyPackage) include;
                    requires.add(packageInclude.getAsyncRequireName());
                    this.getAsyncMetadataJSONHelper(metadata, packageInclude.getAsyncRequireName(), packageInclude.getPackageManifest(this), null);
                }
                else {
                    DependencyResource resourceInclude = (DependencyResource) include;
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
                    dependencies = extension.getDependencies();
                    for (Dependency dependency : dependencies) {
                        if (dependency.isPackageInclude()) {
                            DependencyPackage packageInclude = (DependencyPackage) dependency;
                            requires.add(packageInclude.getAsyncRequireName());
                            this.getAsyncMetadataJSONHelper(metadata, packageInclude.getAsyncRequireName(), packageInclude.getPackageManifest(this), null);
                        }
                        else {
                            DependencyResource resourceInclude = (DependencyResource) dependency;
                            if (resourceInclude.getContentType() == ContentType.JS) {
                                jsIncludes.add(dependency);
                            }
                            else {
                                cssIncludes.add(dependency);    
                            }
                        }
                    }    
                }
            }
        }
        
        AsyncDependencies asyncDependencies = this.createAsyncDependencies(requires, jsIncludes, cssIncludes);
        
        metadata.setAsyncDependencies(requireName, asyncDependencies);
    }

    protected abstract AsyncDependencies createAsyncDependencies(List<String> requires, List<Dependency> jsIncludes, List<Dependency> cssIncludes);

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

		@Override
		public String toString() {
			return "AsyncInclude [requireName=" + requireName
					+ ", packageManifest=" + packageManifest.getSystemPath() + "]";
		}
        
        
        
    }
    
}
