package org.raptorjs.resources.packaging;

public enum ContentType {
    JS("js"), CSS("css");
    
    private String includeTypeName = null;
    
    ContentType(String includeTypeName) {
        this.includeTypeName = includeTypeName;
    }

    public String getDependencyTypeName() {
        return includeTypeName;
    }
    
    
}
