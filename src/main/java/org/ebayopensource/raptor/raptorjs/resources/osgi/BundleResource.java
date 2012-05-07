package org.ebayopensource.raptor.raptorjs.resources.osgi;

import java.io.InputStream;
import java.net.URL;
import java.util.Dictionary;

import org.ebayopensource.raptor.raptorjs.resources.Resource;
import org.osgi.framework.Bundle;

public class BundleResource extends Resource {
    
    private Bundle bundle = null;
    private String fullPath = null;
    private URL url = null;
    
    protected BundleResource(String path, Bundle bundle, String fullPath, URL url) {
        super(path);
        this.bundle = bundle;
        this.fullPath = fullPath;
        this.url = url;
    }

    public Bundle getBundle() {
        return bundle;
    }

    public String getFullPath() {
        return fullPath;
    }

    public URL getUrl() {
        return url;
    }

    @Override
    public String getSystemPath() {
        // TODO Auto-generated method stub
        return fullPath + " (bundle=" + bundle.getSymbolicName() + ")";
    }

    @Override
    public InputStream getResourceAsStream() {
        try {
            return this.url.openStream();
        } catch (Exception e) {
            throw new RuntimeException("Unable to open URL '" + this.url + "' as stream for resource '" + this.fullPath + "' in bundle '" + bundle.getSymbolicName() + "'");
        }
    }

    @Override
    public String toString() {
        return "BundleResource [fullPath=" + fullPath + ", bundle=" + bundle.getSymbolicName() + "]";
    }
    
    public String getBundleHeader(String name) {
        Dictionary<?, ?> headers = bundle.getHeaders();
        String headerValue = (String) headers.get(name);
        return headerValue;
    }

    @Override
    public boolean isDirectory() {
        return false;
    }

    @Override
    public boolean isFile() {
        return true;
    }
    
    
}
