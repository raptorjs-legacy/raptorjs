package org.raptorjs.resources.packaging;

import org.raptorjs.resources.Resource;
import org.raptorjs.resources.ResourceManager;

public abstract class IncludeResource extends Include {
    private Resource resource = null;
    
    private String path = null;
    
    public abstract ContentType getContentType();

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }
    
    @Override
    public boolean isPackageInclude() {
        return false;
    }
    
    @Override
    public void init() {
        this.setPath(this.getProperty("path"));
    }
    
    public Resource getResource(ResourceManager resourceManager) {
        if (this.resource == null) {
            PackageManifest mf = getParentPackageManifest();
            if (mf != null) {
                this.resource = mf.resolveResource(path, resourceManager);
            }
        }
        return this.resource;
    }
    
    @Override
    public boolean exists(ResourceIncluderContext context) {
        Resource resource = this.getResource(context.getResourceManager());
        return resource != null;
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime
                * result
                + ((getParentPackageManifest() == null) ? 0 : getParentPackageManifest()
                        .hashCode());
        result = prime * result + ((path == null) ? 0 : path.hashCode());
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
        IncludeResource other = (IncludeResource) obj;
        if (getParentPackageManifest() == null) {
            if (other.getParentPackageManifest() != null)
                return false;
        } else if (!getParentPackageManifest().equals(other.getParentPackageManifest()))
            return false;
        if (path == null) {
            if (other.path != null)
                return false;
        } else if (!path.equals(other.path))
            return false;
        return true;
    }

    
    
    
}
