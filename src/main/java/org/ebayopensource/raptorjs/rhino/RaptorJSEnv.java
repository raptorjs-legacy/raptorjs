package org.ebayopensource.raptorjs.rhino;

import org.ebayopensource.raptorjs.resources.ClasspathSearchPathEntry;
import org.ebayopensource.raptorjs.resources.ResourceManager;
import org.mozilla.javascript.ScriptableObject;





public abstract class RaptorJSEnv {

    private JavaScriptEngine jsEnv = new JavaScriptEngine();
    private String coreModulesDir = "/META-INF/resources/js/raptor/modules";
    
    private RhinoHelpers rhinoHelpers = null;
    private ResourceManager resourceManager = null;
    public RaptorJSEnv() {
        this(ResourceManager.getInstance());
    }
    
    public RaptorJSEnv(ResourceManager resourceManager) {
        this.resourceManager = resourceManager;
        
        this.init();
        this.createRaptor();
        this.afterInit();
    }

    public void init() {
        
        this.resourceManager.addSearchPathEntry(new ClasspathSearchPathEntry(RaptorJSEnv.class, this.coreModulesDir));
        this.rhinoHelpers = this.createRhinoHelpers();
        
        jsEnv.setGlobal("__rhinoHelpers", this.rhinoHelpers);
        this.getRhinoHelpers().getBootstrap().require("/bootstrap/bootstrap_server.js");
        this.getRhinoHelpers().getBootstrap().require("/bootstrap/bootstrap_rhino.js");
    }
    
    protected abstract void createRaptor();
    
    protected void afterInit() {
        this.getRhinoHelpers().getBootstrap().require("/resources/rhino-resource-search-path-adapter.js");
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
    
    public ScriptableObject require(String name) {
        return (ScriptableObject)this.getJavaScriptEngine().invokeFunction("rhinoRaptorRequire", name);
    }
    
}
