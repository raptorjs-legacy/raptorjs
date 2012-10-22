package org.raptorjs.resources.packaging;

import java.util.HashMap;
import java.util.Map;

public class IncludeFactory {
    private Map<String, Class<? extends Include>> includeTypes = new HashMap<String, Class<? extends Include>>();
    
    public IncludeFactory() {
        this.registerIncludeType("module", IncludeModule.class);
    }
    
    public Include createInclude(String type, Map<String, Object> properties) {
        Class<? extends Include> includeClass = includeTypes.get(type);
        if (includeClass == null) {
            throw new RuntimeException("Invalid include of type \"" + type + "\" (properties=" + properties + ")");
        }
        Include include;
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
    
    public void registerIncludeType(String type, Class<? extends Include> includeClass) {
        this.includeTypes.put(type, includeClass);
    }
    
    public IncludeResource createResourceInclude(ContentType contentType, String path) {
        IncludeResource resourceInclude = (IncludeResource)this.createInclude(contentType.getIncludeTypeName(), null);
        resourceInclude.setPath(path);
        return resourceInclude;
    }
}
