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

package org.raptorjs.templating.rhino;

import java.io.StringWriter;
import java.io.Writer;

import org.mozilla.javascript.Scriptable;
import org.raptorjs.rhino.RaptorJSEnv;


public class TemplateRenderer {

    private RaptorJSEnv raptorJSEnv = null;
    private Scriptable javaScriptModule = null;
    
    public TemplateRenderer(RaptorJSEnv raptorJSEnv) {
        this.raptorJSEnv = raptorJSEnv;        
        
        this.setJavaScriptTemplatingModule(raptorJSEnv.require("raptor/templating"));        
        
        if (this.javaScriptModule == null) {
            throw new RuntimeException("JavaScript compiler not regiesterd");
        }
    }
    
    private void setJavaScriptTemplatingModule(Scriptable o) {
        this.javaScriptModule = o;
    }
    
    protected void handleJavaScriptError(Exception e, String message) {
        throw new RuntimeException(message + ". Exception: " + e, e);
    }
    
    public String renderToString(String templateName, Object data) {
    	StringWriter writer = new StringWriter();
    	this.render(templateName, data, writer);
    	return writer.toString();
    }
    
    public void render(String templateName, Object data, Writer writer) {
    	Scriptable renderContext = this.createRenderContext(writer);
    	this.render(templateName, data, renderContext);
    }
    
    public void render(String templateName, Object data, Scriptable renderContext) {
        try
        {
            this.raptorJSEnv.getJavaScriptEngine().invokeMethod(this.javaScriptModule, "rhinoRender", templateName, data, renderContext);
        }
        catch(Exception e) {
            this.handleJavaScriptError(e, "Unable to render template (name=\"" + templateName + "\").");
        }
    }
    
    public Scriptable createRenderContext(Writer writer) {
        try
        {
            Scriptable context = (Scriptable) this.raptorJSEnv.getJavaScriptEngine().invokeMethod(this.javaScriptModule, "rhinoCreateContext", writer);
            return context;
        }
        catch(Exception e) {
            this.handleJavaScriptError(e, "Unable to create rendering context");
            return null;
        }
    }
    
}
