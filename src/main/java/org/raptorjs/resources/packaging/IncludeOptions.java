package org.raptorjs.resources.packaging;

import java.util.HashSet;
import java.util.Set;

import org.mozilla.javascript.ScriptableObject;

public class IncludeOptions {
    public enum AsyncType {
        ONDEMAND, ONLOAD;
    };
    
    
    private String cssSlot = null;
    private String jsSlot = null;
    private Set<String> enabledExtensions = null;
    private ScriptableObject scriptableExtensionsCollection = null;
    private AsyncType asyncType = null;
    private int delay = 0;
    
    public void setAsyncOnDemand() {
        this.setAsyncType(AsyncType.ONDEMAND);
    }
    
    public void setAsyncOnLoad() {
        this.setAsyncType(AsyncType.ONLOAD);
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
    
    public AsyncType getAsyncType() {
        return asyncType;
    }
    public void setAsyncType(AsyncType asyncType) {
        this.asyncType = asyncType;
    }
    public int getDelay() {
        return delay;
    }
    public void setDelay(int delay) {
        this.delay = delay;
    }
    
    public boolean isAsync() {
        return this.asyncType != null;
    }
    
    public Set<String> getEnabledExtensions() {
        return this.enabledExtensions;
    }
    
    public boolean hasEnabledExtensions() {
    	return this.enabledExtensions != null && !this.enabledExtensions.isEmpty();
    }

    public boolean isModuleExtensionEnabled(String extension) {
        return this.enabledExtensions != null && this.enabledExtensions.contains(extension);
    }
    
    public void enableModuleExtension(String extension) {
        if (this.enabledExtensions == null) {
            this.enabledExtensions = new HashSet<String>();
        }
        this.enabledExtensions.add(extension);
        this.scriptableExtensionsCollection = null;
    }
}
