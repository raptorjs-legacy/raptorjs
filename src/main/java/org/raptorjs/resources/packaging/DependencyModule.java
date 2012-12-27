package org.raptorjs.resources.packaging;




public class DependencyModule extends DependencyPackage {

    private String moduleName = null;
    
    @Override
    public PackageManifest resolvePackageManifest(
            ResourceIncluderContext context) {
        
        PackageManifest manifest = context.getPackageManager().getModulePackageManifestCached(this.moduleName);
        return manifest;
    }

    @Override
    public String getAsyncRequireName() {
        return this.moduleName;
    }

    @Override
    public void init() {
        this.moduleName = this.getProperty("name");
    }

    @Override
    public boolean exists(ResourceIncluderContext context) {
        PackageManifest manifest = this.getPackageManifest(context);
        return manifest != null;
    }   

    @Override
    public String toString() {
        return "IncludeModule [moduleName=" + moduleName + "]";
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result
                + ((moduleName == null) ? 0 : moduleName.hashCode());
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
        DependencyModule other = (DependencyModule) obj;
        if (moduleName == null) {
            if (other.moduleName != null)
                return false;
        } else if (!moduleName.equals(other.moduleName))
            return false;
        return true;
    }

    
    
    
}
