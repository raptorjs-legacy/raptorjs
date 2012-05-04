package org.ebayopensource.raptorjs.rhino;

import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.ScriptableObject;


public class StacktraceHelper {
    private RaptorJSEnv raptorJS = null;

    public StacktraceHelper(RaptorJSEnv raptorJS) {
        super();
        this.raptorJS = raptorJS;
    }

    public RaptorJSEnv getRaptorJS() {
        return raptorJS;
    }
    
    
    public String getJavaScriptStackTrace(Object jsError) {
        
        
        if (jsError instanceof ScriptableObject) {
            ScriptableObject jsErrorScriptable = (ScriptableObject) jsError;
            Object wrappedRhinoException = ScriptableObject.getProperty(jsErrorScriptable, "rhinoException");
            if (wrappedRhinoException != null) {
                RhinoException rhinoException = (RhinoException)((NativeJavaObject)wrappedRhinoException).unwrap();
                return rhinoException.getScriptStackTrace();
//                StringWriter stringWriter = new StringWriter();
//                PrintWriter printWriter = new PrintWriter(stringWriter);
//                rhinoException.printStackTrace(printWriter);
//                return stringWriter.toString();
            }
            
        }
        
        return null;
        //return null;
    }
    
}
