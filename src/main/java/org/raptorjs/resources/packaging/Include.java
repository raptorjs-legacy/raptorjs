package org.raptorjs.resources.packaging;

import java.util.Map;

public abstract class Include {
    private String type = null;
    private boolean async = false;
    private PackageManifest parentPackageManifest = null;
    private Map<String, Object> properties = null;
    
    public abstract void init();
    public abstract boolean isPackageInclude();
    public abstract boolean exists(ResourceIncluderContext context);
    public abstract String toString();
    
    protected abstract void doInclude(IncludeOptions includeOptions, ResourceIncluderContext context);
    protected abstract void doIncludeAsync(IncludeOptions includeOptions, ResourceIncluderContext context);
    
    public void include(IncludeOptions includeOptions, ResourceIncluderContext context) {
        
        if (this.isAsync() || includeOptions.isAsync()) {
            this.includeAsync(includeOptions, context);
            return;
        }

        try
        {
            this.doInclude(includeOptions, context);
        }
        catch(Exception e) {
            throw new RuntimeException("Unable to include " + this + ". Exception: " + e, e);
        }
    }
    
    public void includeAsync(IncludeOptions includeOptions, ResourceIncluderContext context) {
        try
        {
            this.doIncludeAsync(includeOptions, context);
        }
        catch(Exception e) {
            throw new RuntimeException("Unable to handle async include " + this + ". Exception: " + e, e);
        }
    }
    
    
    public abstract int hashCode();
    public abstract boolean equals(Object obj);
    
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
    public boolean isAsync() {
        return async;
    }
    public void setAsync(boolean async) {
        this.async = async;
    }
    public PackageManifest getParentPackageManifest() {
        return parentPackageManifest;
    }
    public void setParentPackageManifest(PackageManifest parentPackageManifest) {
        this.parentPackageManifest = parentPackageManifest;
    }
    
    public String getProperty(String name) {
        Object value = this.properties.get(name);
        return value == null ? null : value.toString();
    }
    
    public Map<String, Object> getProperties() {
        return properties;
    }
    public void setProperties(Map<String, Object> properties) {
        this.properties = properties;
    }
    
    
}
