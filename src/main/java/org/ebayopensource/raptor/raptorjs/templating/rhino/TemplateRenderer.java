package org.ebayopensource.raptor.raptorjs.templating.rhino;

import java.io.Writer;

import org.ebayopensource.raptor.raptorjs.rhino.RaptorJSEnv;
import org.mozilla.javascript.ScriptableObject;


public class TemplateRenderer {

    private RaptorJSEnv raptorJSEnv = null;
    private ScriptableObject javaScriptModule = null;
    
    public TemplateRenderer(RaptorJSEnv raptorJSEnv) {
        this.raptorJSEnv = raptorJSEnv;        
        
        this.setJavaScriptTemplatingModule(raptorJSEnv.require("templating"));        
        
        if (this.javaScriptModule == null) {
            throw new RuntimeException("JavaScript compiler not regiesterd");
        }
    }
    
    private void setJavaScriptTemplatingModule(ScriptableObject o) {
        this.javaScriptModule = o;
    }
    
    protected void handleJavaScriptError(Exception e, String message) {
        throw new RuntimeException(message + ". Exception: " + e, e);
    }
    
    public String renderToString(String templateName, String json) {
        try
        {
            String output = (String) this.raptorJSEnv.getJavaScriptEngine().invokeMethod(this.javaScriptModule, "rhinoRenderToString", templateName, json);
            return output;
        }
        catch(Exception e) {
            this.handleJavaScriptError(e, "Unable to render template (name=\"" + templateName + "\").");
            return null;
        }
    }
    
    public void render(String templateName, String json, Writer writer) {
        try
        {
            this.raptorJSEnv.getJavaScriptEngine().invokeMethod(this.javaScriptModule, "rhinoRender", templateName, json, writer);
        }
        catch(Exception e) {
            this.handleJavaScriptError(e, "Unable to render template (name=\"" + templateName + "\").");
        }
    }
    
}
