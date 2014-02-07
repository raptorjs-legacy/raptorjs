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

package org.raptorjs.rhino;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.Collections;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.commonjs.module.provider.UrlModuleSourceProvider;
import org.raptorjs.resources.ClasspathSearchPathEntry;
import org.raptorjs.resources.ResourceManager;
import org.raptorjs.rhino.amd.InjectDefineScript;
import org.raptorjs.rhino.commonjs.module.Require;
import org.raptorjs.rhino.commonjs.module.provider.RaptorUrlModuleSourceProvider;





public class RaptorJSEnv {

    private JavaScriptEngine jsEnv = new JavaScriptEngine();
    private String coreModulesDir = null;
    
    private RhinoHelpers rhinoHelpers = null;
    private ResourceManager resourceManager = null;
    private InjectDefineScript injectDefineScript = null;
    
    private ScriptableObject raptor = null;
    
    public RaptorJSEnv(ResourceManager resourceManager) {
        this.resourceManager = resourceManager;
        
        this.beforeInit();
        this.init();
        this.afterInit();
    }

    public void init() { 
        Context cx = Context.enter();
        injectDefineScript = new InjectDefineScript(this);
        
        ScriptableObject globalScope = this.getJavaScriptEngine().getGlobalScope();
        globalScope.put("global", globalScope, globalScope);
        Require require = this.createRequire(cx, globalScope);
        require.install(globalScope);
        
        this.raptor = (ScriptableObject) this.getJavaScriptEngine().invokeMethod(globalScope, "require", "raptor");
        injectDefineScript.setRaptor(raptor);
        this.resourceManager.addSearchPathEntry(0, new ClasspathSearchPathEntry(RaptorJSEnv.class, "/META-INF/resources"));
        
        this.rhinoHelpers = this.createRhinoHelpers();
        jsEnv.setGlobal("__rhinoHelpers", this.rhinoHelpers);
        
        
        
        this.getJavaScriptEngine().invokeMethod(globalScope, "require", "raptor-main_rhino");
        
        
        Context.exit();
    }
    
    private Require createRequire(Context cx, Scriptable scope)
    {
    	URI dirUri = this.getDirectory();
    	Iterable<URI> uris = Collections.singleton(dirUri);
    	UrlModuleSourceProvider urlModuleSourceProvider = new RaptorUrlModuleSourceProvider(uris, null);

    	Require require = new RaptorRequire(
        		cx, 
        		scope, 
        		urlModuleSourceProvider, 
        		this.injectDefineScript, 
        		null, 
        		false /* not sandboxed */,
        		this);
    	
    	return require;
    }
    
    private URI getDirectory() {
    	URL raptorUrl = RaptorJSEnv.class.getResource("/META-INF/resources/raptor/raptor.js");
        final String jsFile = raptorUrl.toExternalForm();
        try {
			return new URI(jsFile.substring(0, jsFile.lastIndexOf('/') + 1));
		} catch (URISyntaxException e) {
			throw new RuntimeException("Unable to get directory for raptor.js as a URI. Exception: " + e, e);
		}
    }
    
    protected void beforeInit() {
    }
    
    protected void afterInit() {
    }
        
    protected RhinoHelpers createRhinoHelpers() {
        return new RhinoHelpers(this);
    }

    public JavaScriptEngine getJavaScriptEngine() {
        return jsEnv;
    }

    public RhinoHelpers getRhinoHelpers() {
        return rhinoHelpers;
    }

    public ResourceManager getResourceManager() {
        return resourceManager;
    }

    public String getCoreModulesDir() {
        return coreModulesDir;
    }

    public void setCoreModulesDir(String coreModulesDir) {
        this.coreModulesDir = coreModulesDir;
    }
    
    public Scriptable require(String name) {
    	return (Scriptable)this.getJavaScriptEngine().invokeMethod(this.raptor, "require", name);
    }
    
    public Scriptable find(String name) {
    	if (this.raptor == null) {
    		return null;
    	}
    	
    	Object object = this.getJavaScriptEngine().invokeMethod(this.raptor, "find", name);
    	if (object == null) {
    		return null;
    	}
    	else if (object instanceof Scriptable) {
    		return (Scriptable)object;
    	}
    	if (object instanceof Undefined) {
    		return null;
    	}
    	else {
    		throw new RuntimeException("Module is not a scriptable object. It is of type \"" + object.getClass().getName() + "\". Object: " + object );
    	}
    }
    
    public void load(String name) {
    	this.getJavaScriptEngine().invokeMethod(this.raptor, "find", name);
    }
    
    public void enableExtension(String name) {
    	this.getJavaScriptEngine().invokeMethod(this.require("raptor/packaging"), "enableExtension", name);
    }
}
