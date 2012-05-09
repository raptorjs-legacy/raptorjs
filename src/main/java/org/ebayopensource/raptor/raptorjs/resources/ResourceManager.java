package org.ebayopensource.raptor.raptorjs.resources;

import java.io.File;
import java.util.LinkedList;
import java.util.List;


public class ResourceManager {
    private static final ResourceManager INSTANCE = new ResourceManager();
    
    private List<ResourcesListener> listeners = new LinkedList<ResourcesListener>();
    
    public static ResourceManager getInstance() {
        return ResourceManager.INSTANCE;
    }
    
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
