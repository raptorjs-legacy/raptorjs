package org.ebayopensource.raptor.raptorjs.resources;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.Enumeration;
import java.util.jar.Attributes;
import java.util.jar.Manifest;

public class OSGIAdapter {

    public static OSGIAdapter instance = new OSGIAdapter();

    public static OSGIAdapter getInstance() {
        return instance;
    }
    
    public void addSearchPathEntriesFromOSGIManifests() throws IOException {
        Enumeration<URL> manifestUrls = null;
        
        ClassLoader cl = OSGIAdapter.class.getClassLoader();

        try {
            manifestUrls = cl.getResources("META-INF/MANIFEST.MF");
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        
        if (manifestUrls != null) {
            ResourceManager resourceManager = ResourceManager.getInstance();
            
            while(manifestUrls.hasMoreElements()) {
                URL manifestUrl = manifestUrls.nextElement();
                InputStream in = manifestUrl.openStream();
                
                Manifest manifest = null;
                try {
                    manifest = new Manifest(in);
                } catch (Exception e) {
                    throw new RuntimeException("Unable to get input stream reader for manifest with URL \"" + manifestUrl + "\". Exception: " + e, e);
                }
                finally {
                    if (in != null) {
                        in.close();
                    }
                }

                if (manifest != null) {
                    
                    Attributes attributes = manifest.getMainAttributes();
                    if (attributes != null) {
                        String raptorSearchPath = attributes.getValue("X-Raptor-Resource-Search-Path");//manifest.getHeader("X-Raptor-Resource-Search-Path");
                        if (raptorSearchPath != null) {
                            String[] parts = raptorSearchPath.split("\\s*,\\s*");
                            for (String basePath : parts) {
                                resourceManager.addClasspathSearchPathEntry(OSGIAdapter.class, basePath);
                            }
                        }
                    }
                }
            }
        }
    }
    
    public static void main(String[] args) {
        try {
            OSGIAdapter.getInstance().addSearchPathEntriesFromOSGIManifests();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
