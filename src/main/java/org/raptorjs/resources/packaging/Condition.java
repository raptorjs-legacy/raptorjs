package org.raptorjs.resources.packaging;

import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.ScriptableObject;
import org.raptorjs.rhino.JavaScriptEngine;
import org.raptorjs.rhino.RaptorJSEnv;

public class Condition {
    private NativeFunction function = null;
    private String condition = null;
    private String name = null;
    
    public Condition(String conditionStr, String name) {
        this.condition = conditionStr;
        this.name = name;
    }
    
    protected boolean checkCondition(RaptorJSEnv jsEnv, ScriptableObject extensionCollection) {
        JavaScriptEngine jsEngine = jsEnv.getJavaScriptEngine();
        if (this.function == null) {
            this.function = (NativeFunction)jsEngine.eval(
                    "(function (extensions) { return " + this.condition + ";})", 
                    this.name);    
        }
        
        Boolean result =  (Boolean)jsEngine.invokeFunction(this.function, extensionCollection);
        return result.booleanValue();
    }
    
}