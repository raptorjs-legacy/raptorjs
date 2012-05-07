package org.ebayopensource.raptor.raptorjs.rhino;

import java.io.File;

public class RuntimeHelper {
    private RaptorJSEnv raptorJS;
    
    public RuntimeHelper(RaptorJSEnv raptorJS) {
        this.raptorJS = raptorJS;
    }
    
    public void evaluateFile(String path) {
        File file = new File(path);
        String source = this.raptorJS.getRhinoHelpers().getFiles().readFile(file, "UTF-8");
        this.raptorJS.getJavaScriptEngine().eval(source, path);
    }
    
    public void evaluateString(String source, String path) {
        this.raptorJS.getJavaScriptEngine().eval(source, path);
    }
}
