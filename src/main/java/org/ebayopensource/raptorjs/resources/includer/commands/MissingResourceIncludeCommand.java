package org.ebayopensource.raptorjs.resources.includer.commands;

import org.ebayopensource.raptorjs.resources.includer.ResourceIncludeOptions;
import org.ebayopensource.raptorjs.resources.includer.ResourceIncluderContext;

public class MissingResourceIncludeCommand implements IncludeCommand {
    private String resourcePath = null;
    private RuntimeException exception = null;
    
    public MissingResourceIncludeCommand(String resourcePath, RuntimeException exception) {
        this.resourcePath = resourcePath;
        this.exception = exception;
    }
    @Override
    public void execute(ResourceIncluderContext context, ResourceIncludeOptions includeOptions) {
        throw exception;
    }
    @Override
    public String toString() {
        return "MissingResourceIncludeCommand [resourcePath=" + resourcePath + "]";
    }
    
    
    
}