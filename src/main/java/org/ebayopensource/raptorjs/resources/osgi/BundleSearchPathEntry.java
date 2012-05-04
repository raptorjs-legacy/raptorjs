package org.ebayopensource.raptorjs.resources.osgi;

import java.net.URL;

import org.ebayopensource.raptorjs.resources.Resource;
import org.ebayopensource.raptorjs.resources.SearchPathEntry;
import org.osgi.framework.Bundle;

public class BundleSearchPathEntry extends SearchPathEntry {

    private Bundle bundle = null;
    private String basePath = null;
    
    public BundleSearchPathEntry(Bundle bundle, String basePath) {
        this.bundle = bundle;
        this.basePath = basePath;
    }
    
    @Override
    public Resource findResource(String path) {
        
        if (this.bundle.getState() != Bundle.ACTIVE) return null;
        
        String fullPath = ("/".equals(this.basePath) ? "" : this.basePath) + path;
        
        URL resourceURL = this.bundle.getResource(fullPath);
        if (resourceURL != null) {
            return new BundleResource(path, this.bundle, fullPath, resourceURL);
        }
        return null;
    }

    @Override
    public String toString() {
        return "BundleSearchPathEntry [bundle=" + bundle.getSymbolicName() + " (" + bundle.getBundleId() + ")" + ", basePath="
                + basePath + "]";
    }
    
    
}
