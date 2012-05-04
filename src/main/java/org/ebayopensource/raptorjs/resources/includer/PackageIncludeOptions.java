package org.ebayopensource.raptorjs.resources.includer;

import java.util.HashSet;
import java.util.Set;

import org.ebayopensource.raptorjs.rhino.RaptorJSEnv;
import org.mozilla.javascript.ScriptableObject;


public class PackageIncludeOptions extends ResourceIncludeOptions {
    
    public enum AsyncType {
        ONDEMAND, ONLOAD;
    };
    
    private Set<String> moduleExtensions = null;
    private ScriptableObject scriptableExtensionsCollection = null;
    
    private AsyncType asyncType = null;
    private int delay = 0;
    
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

    public boolean isModuleExtensionEnabled(String extension) {
        return this.moduleExtensions != null && this.moduleExtensions.contains(extension);
    }
    
    public void enableModuleExtension(String extension) {
        if (this.moduleExtensions == null) {
            this.moduleExtensions = new HashSet<String>();
        }
        this.moduleExtensions.add(extension);
        this.scriptableExtensionsCollection = null;
    }
    
    public ScriptableObject getScriptableExtensionsCollection(RaptorJSEnv raptorJSEnv) {
        
        if (this.scriptableExtensionsCollection == null) {
            ScriptableObject packaging = raptorJSEnv.require("packaging");
            this.scriptableExtensionsCollection = (ScriptableObject) raptorJSEnv.getJavaScriptEngine().invokeMethod(packaging, "rhinoCreateExtensions", raptorJSEnv.getJavaScriptEngine().javaToJS(moduleExtensions));
        }
        
        return this.scriptableExtensionsCollection;
    }
}
