package org.ebayopensource.raptorjs.rhino;

import org.ebayopensource.raptorjs.resources.Resource;
import org.ebayopensource.raptorjs.resources.ResourceManager;

public class ResourcesHelper {
    private ResourceManager resourceManager = null;
    
    public ResourcesHelper(RaptorJSEnv jsEnv) {
        this.resourceManager = jsEnv.getResourceManager();
    }
    
    public Resource findResource(String path) {
        Resource resource = this.resourceManager.findResource(path);
        return resource;
    }
}
