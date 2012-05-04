package org.ebayopensource.raptorjs.templating.rhino;

import org.ebayopensource.raptorjs.rhino.RaptorJSEnv;
import org.mozilla.javascript.ScriptableObject;


public class TemplateCompiler {

    private static CompilerOptions defaultOptions = new CompilerOptions();
    
    private RaptorJSEnv raptorJSEnv = null;
    private ScriptableObject javaScriptCompiler = null;
    
    public TemplateCompiler(RaptorJSEnv raptorJSEnv) {
        this.raptorJSEnv = raptorJSEnv;
        this.setJavaScriptCompilerModule(raptorJSEnv.require("templating.compiler"));
        if (this.javaScriptCompiler == null) {
            throw new RuntimeException("JavaScript compiler not regiesterd");
        }
    }
    
    private void setJavaScriptCompilerModule(ScriptableObject o) {
        this.javaScriptCompiler = o;
    }
    
    protected void handleJavaScriptError(Exception e, String message) {
        throw new RuntimeException(message + ". Exception: " + e, e);
    }
    
    public String compile(String src, String path) {
        return this.compile(src, path, TemplateCompiler.defaultOptions);
    }
    
    public String compile(String src, String path, CompilerOptions options) {
        if (options == null) {
            options = TemplateCompiler.defaultOptions;
        }
        
        try
        {
            String compiled = (String) this.raptorJSEnv.getJavaScriptEngine().invokeMethod(this.javaScriptCompiler, "rhinoCompile", src, path, this.raptorJSEnv.getJavaScriptEngine().javaToJS(options));
            return compiled;
        }
        catch(Exception e) {
            this.handleJavaScriptError(e, "Unable to compile template (path=\"" + path + "\").");
            return null;
        }
    }
    
    public String compileResource(String path) {
        return this.compileResource(path, TemplateCompiler.defaultOptions);
    }
    
    public String compileResource(String path, CompilerOptions options) {
        if (options == null) {
            options = TemplateCompiler.defaultOptions;
        }
        
        try
        {
            String compiled = (String) this.raptorJSEnv.getJavaScriptEngine().invokeMethod(this.javaScriptCompiler, "rhinoCompileResource", path, this.raptorJSEnv.getJavaScriptEngine().javaToJS(options));
            return compiled;
        }
        catch(Exception e) {
            this.handleJavaScriptError(e, "Unable to compile template resource (path=\"" + path + "\").");
            return null;
        }
    }
    
    public void compileAndLoadResource(String path) {
        this.compileAndLoadResource(path, TemplateCompiler.defaultOptions);
    }
    public void compileAndLoadResource(String path, CompilerOptions options) {
        if (options == null) {
            options = TemplateCompiler.defaultOptions;
        }
        
        try
        {
            this.raptorJSEnv.getJavaScriptEngine().invokeMethod(this.javaScriptCompiler, "rhinoCompileAndLoadResource", path, this.raptorJSEnv.getJavaScriptEngine().javaToJS(options));
        }
        catch(Exception e) {
            this.handleJavaScriptError(e, "Unable to compile and template resource (path=\"" + path + "\").");
        }
    }
    
    public String compileTaglib(String xmlSource, String path) {
        if (path == null) {
            path = "(unknown)";
        }
        
        try
        {
            return (String) this.raptorJSEnv.getJavaScriptEngine().invokeMethod(this.javaScriptCompiler, "compileTaglib", xmlSource, path);
        }
        catch(Exception e) {
            this.handleJavaScriptError(e, "Unable to compile taglib at path \"" + path + "\"");
            return null;
        }
    }
    
}
