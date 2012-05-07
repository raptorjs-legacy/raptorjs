package org.ebayopensource.raptor.raptorjs.resources;

import java.net.URL;

public class ClasspathSearchPathEntry extends SearchPathEntry {

    private Class<?> clazz = null;
    private String basePath = null;
    
    public ClasspathSearchPathEntry(Class<?> clazz, String basePath) {
        this.clazz = clazz;
        this.basePath = "/".equals(basePath) ? "" : basePath;
        
    }
    
    @Override
    public Resource findResource(String path) {
        String fullPath = this.basePath + path;
        
        URL url = this.clazz.getResource(fullPath);
        if (url != null) {
            return new URLResource(path, url, true);
        }
        else {
            return null;
        }
    }

    @Override
    public String toString() {
        return "ClasspathSearchPathEntry [clazz=" + clazz + ", basePath="
                + basePath + "]";
    }
    
    

}
