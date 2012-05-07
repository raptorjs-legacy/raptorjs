package org.ebayopensource.raptor.raptorjs.resources.includer;

import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import javax.servlet.ServletRequest;

import org.ebayopensource.raptor.raptorjs.resources.includer.ResourceIncluder.ResourceType;
import org.ebayopensource.raptor.raptorjs.resources.packaging.PackageManager;
import org.ebayopensource.raptor.raptorjs.resources.packaging.PackageManifest.Extension;
import org.ebayopensource.raptor.raptorjs.rhino.RaptorJSEnv;
import org.mozilla.javascript.ScriptableObject;



public abstract class ResourceIncluderContext {
    private Map<String, IncludedPackage> includedPackagesByPackagePath = new HashMap<String, IncludedPackage>();
    private Map<String, IncludedPackage> includedAsyncPackagesByPath = new HashMap<String, IncludedPackage>();
    
    private Set<String> includedCSSResources = new HashSet<String>();
    private Set<String> includedJSResources = new HashSet<String>();
    
    private AsyncRequiresMetadataCollection asyncRequiresMetadata = null;
    
    private String defaultCssSlot = "head";
    private String defaultJsSlot = "body";
    private Set<String> defaultPackageExtensions = new HashSet<String>();
    
    public static ResourceIncluderContext getInstance(ServletRequest request) {
        ResourceIncluder resourceIncluder = ResourceIncluder.getProvider(request).getResourceIncluder();
        return resourceIncluder.getResourceIncluderContext(request);
    }
    
    private ResourceIncluder resourceIncluder = null;
    private PackageManager packageManager = null;
    private RaptorJSEnv raptorJSEnv = null;
    
    
    public ResourceIncluderContext(ResourceIncluder resourceIncluder, PackageManager packageManager, RaptorJSEnv raptorJSEnv) {
        this.resourceIncluder = resourceIncluder;
        this.packageManager = packageManager;
        this.raptorJSEnv = raptorJSEnv;
    }
    
    public ScriptableObject getScriptableExtensionsCollection(PackageIncludeOptions packageIncludeOptions) {
        return packageIncludeOptions.getScriptableExtensionsCollection(this.raptorJSEnv);
    }
    
    public void enableExtension(String extension) {
        defaultPackageExtensions.add(extension);
    }
    
    public void disableExtension(String extension) {
        defaultPackageExtensions.remove(extension);
    }
    
    public boolean isExtensionEnabled(Extension extension, PackageIncludeOptions packageIncludeOptions) {
        if (extension.isDefault()) {
            return true;
        }
        else if (extension.hasCondition()) {
            return extension.checkCondition(this.getScriptableExtensionsCollection(packageIncludeOptions));            
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
    
    public boolean isPackageExtensionIncluded(String packagePath, Extension extension) {
        IncludedPackage includedPackage = includedPackagesByPackagePath.get(packagePath);
        if (includedPackage == null) {
            return false;
        }
        
        return includedPackage.isExtensionIncluded(extension);
    }
    
    public void setPackageExtensionIncluded(String packagePath, Extension extension) {

        IncludedPackage includedPackage = includedPackagesByPackagePath.get(packagePath);
        if (includedPackage == null) {
            includedPackage = new IncludedPackage();
            includedPackagesByPackagePath.put(packagePath, includedPackage);
        }
        
        includedPackage.setExtensionIncluded(extension);
    }
    
    public boolean isAsyncPackageIncluded(String require, Set<Extension> extensions) {
        
        
        IncludedPackage includedPackage = this.includedAsyncPackagesByPath.get(require);
        if (includedPackage == null) {
            return false;
        }
        
        
        return includedPackage.isAllExtensionsIncluded(extensions);
    }

    public void setAsyncPackageIncluded(String packagePath, Set<Extension> extensions) {
        
        IncludedPackage includedPackage = includedAsyncPackagesByPath.get(packagePath);
        if (includedPackage == null) {
            includedPackage = new IncludedPackage();
            includedAsyncPackagesByPath.put(packagePath, includedPackage);
        }
        
        includedPackage.setIncludedExtensions(extensions);
    }
    
    public Set<Extension> getIncludedAsyncPackageExtensions(String packagePath) {
        
        IncludedPackage includedPackage = includedAsyncPackagesByPath.get(packagePath);
        if (includedPackage == null) {
            return Collections.emptySet();
        }
        else {
            return includedPackage.getIncludedExtensions();
        }
    }
    
    public boolean isResourceIncluded(String path, ResourceType resourceType) {
        switch(resourceType) {
            case JS:
                return this.includedJSResources.contains(path);
            case CSS:
                return this.includedCSSResources.contains(path);
            default:
                throw new RuntimeException("Unsupported resource type: " + resourceType);
        }
        
    }
    
    public void setResourceIncluded(String path, ResourceType resourceType) {
        switch(resourceType) {
            case JS:
                this.includedJSResources.add(path);
                break;
            case CSS:
                this.includedCSSResources.add(path);
                break;
            default:
                throw new RuntimeException("Unsupported resource type: " + resourceType);
        }
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
    
    public void setAsyncRequireJSON(String require, String json) {
        if (this.asyncRequiresMetadata == null) {
            this.asyncRequiresMetadata = new AsyncRequiresMetadataCollection();
        }
        this.asyncRequiresMetadata.setModuleJSON(require, json);
    }
    
    public boolean isAsyncRequiresMetadataAvailable() {
        return this.asyncRequiresMetadata != null;
    }
    
    
    
    public AsyncRequiresMetadataCollection getAsyncModuleLoadingMetadata() {
        return asyncRequiresMetadata;
    }



    private static class IncludedPackage {
        private Set<Extension> includedExtensionsSet = new HashSet<Extension>();
        
        public boolean isExtensionIncluded(Extension extension) {
            return includedExtensionsSet.contains(extension);
        }
        
        public boolean setExtensionIncluded(Extension extension) {
            return includedExtensionsSet.add(extension);
        }

        public void setIncludedExtensions(Set<Extension> extensions) {
            includedExtensionsSet = extensions;
        }
        
        public boolean isAllExtensionsIncluded(Set<Extension> extensions) {
            for (Extension extension : extensions) {
                if (!this.includedExtensionsSet.contains(extension)) {
                    return false;
                }
            }
            return true;
        }
        
       public Set<Extension> getIncludedExtensions() {
           return this.includedExtensionsSet;
       }

        
    }



    public PackageManager getPackageManager() {
        return packageManager;
    }
    
    
}
