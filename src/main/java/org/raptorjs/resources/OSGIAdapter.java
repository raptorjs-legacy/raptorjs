/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.raptorjs.resources;

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
    
    public void addSearchPathEntriesFromOSGIManifests(ResourceManager resourceManager) throws IOException {
        Enumeration<URL> manifestUrls = null;
        
        ClassLoader cl = OSGIAdapter.class.getClassLoader();

        try {
            manifestUrls = cl.getResources("META-INF/MANIFEST.MF");
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        
        if (manifestUrls != null) {
            
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
}
