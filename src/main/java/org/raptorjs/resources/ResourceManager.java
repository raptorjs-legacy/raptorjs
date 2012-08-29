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

import java.io.File;
import java.util.LinkedList;
import java.util.List;


public class ResourceManager {
    
    
    private List<ResourcesListener> listeners = new LinkedList<ResourcesListener>();
   
    private List<SearchPathEntry> searchPathEntries = new LinkedList<SearchPathEntry>();
    
    
    public ResourceManager() {
        
    }
    
    /**
     * 
     * @param path
     * @return The resource if found, null otherwise.
     */
    public synchronized Resource findResource(String path) {
        for (SearchPathEntry searchPathEntry : this.searchPathEntries) {
            Resource resource = searchPathEntry.findResource(path);
            if (resource != null) {
                return resource;
            }
        }
        return null;
    }
    
    public void addDirSearchPathEntry(File dir) {
        this.addSearchPathEntry(new DirSearchPathEntry(dir));
    }
    
    public void addClasspathSearchPathEntry(Class<?> clazz, String basePath) {
        this.addSearchPathEntry(new ClasspathSearchPathEntry(clazz, basePath));
    }
    
    public synchronized void addSearchPathEntry(SearchPathEntry searchPathEntry) {
        searchPathEntries.add(searchPathEntry);
        this.notifyResourcesModified();
    }
    
    public synchronized void removeSearchPathEntry(SearchPathEntry searchPathEntry) {
        searchPathEntries.remove(searchPathEntry);
        this.notifyResourcesModified();
    }
    
    public synchronized void notifyResourcesModified() {
        for (ResourcesListener listener : this.listeners) {
            listener.onResourcesModified();
        }
    }
    
    public synchronized void addListener(ResourcesListener listener) {
        this.listeners.add(listener);
    }
}
