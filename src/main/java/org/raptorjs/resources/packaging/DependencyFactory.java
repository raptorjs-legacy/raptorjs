package org.raptorjs.resources.packaging;

import java.util.HashMap;
import java.util.Map;

public class DependencyFactory {
    private Map<String, Class<? extends Dependency>> includeTypes = new HashMap<String, Class<? extends Dependency>>();
    
    public DependencyFactory() {
        this.registerIncludeType("module", DependencyModule.class);
    }
    
    public Dependency createInclude(String type, Map<String, Object> properties) {
        Class<? extends Dependency> includeClass = includeTypes.get(type);
        if (includeClass == null) {
            throw new RuntimeException("Invalid include of type \"" + type + "\" (properties=" + properties + ")");
        }
        Dependency include;
        try {
            include = includeClass.newInstance();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        include.setType(type);
        
        if (properties != null) {
            
            Object asyncObj = properties.get("async");
            if (asyncObj instanceof Boolean) {
                include.setAsync(true);
            }
            
            include.setProperties(properties);    
            include.init();
        }
        
        return include;
        
    }
    
    public void registerIncludeType(String type, Class<? extends Dependency> includeClass) {
        this.includeTypes.put(type, includeClass);
    }
    
    public DependencyResource createResourceInclude(ContentType contentType, String path) {
        DependencyResource resourceInclude = (DependencyResource)this.createInclude(contentType.getIncludeTypeName(), null);
        resourceInclude.setPath(path);
        return resourceInclude;
    }
}
