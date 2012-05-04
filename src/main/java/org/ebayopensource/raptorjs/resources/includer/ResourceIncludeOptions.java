package org.ebayopensource.raptorjs.resources.includer;

public class ResourceIncludeOptions {
    public final static ResourceIncludeOptions DEFAULT_OPTIONS = new ResourceIncludeOptions();
    public final static ResourceIncludeOptions IGNORE_MISSING_OPTIONS = new ResourceIncludeOptions(true);
    
    private boolean ignoreMissing = false;
    private String cssSlot = null;
    private String jsSlot = null;
    
    public ResourceIncludeOptions() {
        
    }
    
    public ResourceIncludeOptions(boolean ignoreMissing) {
        this.ignoreMissing = ignoreMissing;
    }
    

    public boolean isIgnoreMissing() {
        return ignoreMissing;
    }

    public void setIgnoreMissing(boolean ignoreMissing) {
        this.ignoreMissing = ignoreMissing;
    }

    public String getCssSlot() {
        return cssSlot;
    }

    public void setCssSlot(String cssSlot) {
        this.cssSlot = cssSlot;
    }

    public String getJsSlot() {
        return jsSlot;
    }

    public void setJsSlot(String jsSlot) {
        this.jsSlot = jsSlot;
    }
    
    
    
    
    
    
}
