package org.ebayopensource.raptorjs.resources.includer;

import org.ebayopensource.raptorjs.resources.includer.ResourceIncluder.ResourceType;

class ResourceIncludeKey {
    String path = null;
    ResourceType resourceType = null;
    public ResourceIncludeKey(String path, ResourceType resourceType) {
        super();
        this.path = path;
        this.resourceType = resourceType;
    }
    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((path == null) ? 0 : path.hashCode());
        result = prime * result
                + ((resourceType == null) ? 0 : resourceType.hashCode());
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
        ResourceIncludeKey other = (ResourceIncludeKey) obj;
        if (path == null) {
            if (other.path != null)
                return false;
        } else if (!path.equals(other.path))
            return false;
        if (resourceType != other.resourceType)
            return false;
        return true;
    }
}