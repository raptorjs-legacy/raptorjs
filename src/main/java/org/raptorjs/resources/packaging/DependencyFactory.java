package org.raptorjs.resources.packaging;

import java.util.HashMap;
import java.util.Map;

public class DependencyFactory {
    private Map<String, Class<? extends Dependency>> dependencyTypes = new HashMap<String, Class<? extends Dependency>>();
    
    public DependencyFactory() {
        this.registerIncludeType("module", DependencyModule.class);
    }
    
    public Dependency createDependency(String type, Map<String, Object> properties) {
        Class<? extends Dependency> includeClass = dependencyTypes.get(type);
        if (includeClass == null) {
            throw new RuntimeException("Invalid include of type \"" + type + "\" (properties=" + properties + ")");
        }
        Dependency dependency;
        try {
            dependency = includeClass.newInstance();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        dependency.setType(type);
        
        if (properties != null) {
            
            Object asyncObj = properties.get("async");
            if (asyncObj instanceof Boolean) {
                dependency.setAsync(true);
            }
            
            dependency.setProperties(properties);    
            dependency.init();
        }
        
        return dependency;
        
    }
    
    public void registerIncludeType(String type, Class<? extends Dependency> dependencyClass) {
        this.dependencyTypes.put(type, dependencyClass);
    }
    
    public DependencyResource createResourceDependency(ContentType contentType, String path) {
        DependencyResource resourceDependency = (DependencyResource)this.createDependency(contentType.getDependencyTypeName(), null);
        resourceDependency.setPath(path);
        return resourceDependency;
    }
}
