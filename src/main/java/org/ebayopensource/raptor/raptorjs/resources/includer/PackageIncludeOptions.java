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

package org.ebayopensource.raptor.raptorjs.resources.includer;

import java.util.HashSet;
import java.util.Set;

import org.ebayopensource.raptor.raptorjs.rhino.RaptorJSEnv;
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
