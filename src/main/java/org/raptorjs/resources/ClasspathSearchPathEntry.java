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
import java.net.URL;
import java.util.Enumeration;

import org.raptorjs.resources.ResourceManager.ResourceCallback;

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
            return new URLResource(path, this, fullPath, url, true);
        }
        else {
            return null;
        }
    }
    
    @Override
    public void forEachResource(String path, ResourceCallback callback) {
    	String fullPath = this.basePath + path;
    	
    	if (fullPath.startsWith("/")) {
    		fullPath = fullPath.substring(1);
    	}
    	
    	
    	Enumeration<URL> urls;
		try {
			urls = this.clazz.getClassLoader().getResources(fullPath);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
		
    	while (urls.hasMoreElements()) {
    		URL url = urls.nextElement();
    		Resource resource = new URLResource(path, this, fullPath, url, true);
    		callback.resourceFound(resource);
    	}
    	
    	
    }

    @Override
    public String toString() {
        return "ClasspathSearchPathEntry [clazz=" + clazz + ", basePath="
                + basePath + "]";
    }
    
    

}
