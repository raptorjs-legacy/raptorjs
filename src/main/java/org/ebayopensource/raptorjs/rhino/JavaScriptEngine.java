package org.ebayopensource.raptorjs.rhino;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringReader;
import java.net.URL;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.ScriptableObject;

public class JavaScriptEngine {
    
    private ScriptableObject globalScope = null;
    
    public JavaScriptEngine()
    {

        Context cx = ContextFactory.getGlobal().enterContext();

        this.initRhinoGlobal();
        
        try {

            this.globalScope = cx.initStandardObjects();
        }
        finally
        {
            Context.exit();
        }
    }
    
    private synchronized void initRhinoGlobal()
    {
        
        if (!ContextFactory.hasExplicitGlobal()){
            ContextFactory.initGlobal(new ContextFactory() {
                public boolean hasFeature(Context cx, int featureIndex)
                {
                    switch (featureIndex) {
                        case Context.FEATURE_STRICT_MODE:
                            return false;

                        case Context.FEATURE_NON_ECMA_GET_YEAR:
                            return true;

                        case Context.FEATURE_MEMBER_EXPR_AS_FUNCTION_NAME:
                            return true;

                        case Context.FEATURE_RESERVED_KEYWORD_AS_IDENTIFIER:
                            return true;

                        case Context.FEATURE_PARENT_PROTO_PROPERTIES:
                            return false;

                        case Context.FEATURE_DYNAMIC_SCOPE:
                            return true;

                        case Context.FEATURE_STRICT_VARS:
                            return true;
                    }
                    return super.hasFeature(cx, featureIndex);
                }

                @Override
                protected Context makeContext() {
                    Context context = super.makeContext();
                    context.setOptimizationLevel(9);
                    return context;
                }
            });
        }
    }
    
    public Object javaToJS(Object o) {
        Context context = Context.enter();
        try
        {
            
            return Context.javaToJS(o, this.globalScope);
        }
        finally
        {
            if (context != null)
            {
                Context.exit();
            }
        }
        
        
    }
    
    public Object eval(String source, String path) {
        StringReader reader = new StringReader(source);
        return this.eval(reader, path);
    }
    
    public Object eval(InputStream source, String path) {
        InputStreamReader reader = new InputStreamReader(source);
        return this.eval(reader, path);
    }
    
    public Object eval(Reader source, String path) {
        
        Context context = Context.enter();
        try
        {
            
            return context.evaluateReader(this.globalScope, source, path, 1, null);
        }
        catch(Exception e) {

            throw new RuntimeException("An error occurred when evaluating \"" + path + "\". Exception: "  + e, e);
        }
        finally
        {
            if (context != null)
            {
                Context.exit();
            }
        }
    }
    
    public Object evalClasspathResource(String path, Class<?> clazz) {
        URL url = clazz.getResource(path);
        if (url == null) {
            throw new RuntimeException("Resource not found: " + path);
        }
        
        InputStream in;
        try {
            in = url.openStream();
        } catch (IOException e) {
            throw new RuntimeException("Unable to open stream for resource " + url.toString() + ". Exception: " + e, e);
        }
        
        try
        {
            return this.eval(in, url.toString());
        }
        finally
        {
            if (in != null) {
                try {
                    in.close();
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }
        }
    }
    
    public void setGlobal(String name, Object value) {
        this.globalScope.put(name, globalScope, value);
    }
    
    public Object invokeFunction( NativeFunction function, Object ...args) {        
        Context context = Context.enter();
        try {
            return function.call(context, this.globalScope, this.globalScope, args);
        }
        catch (Exception e) {
            throw new RuntimeException("An error occurred while trying to invoke function \"" + function + "\". Exception: " + e, e);
        }
        finally
        {
            if (context != null)
            {
                Context.exit();
            }
        }
    }
    
    public Object invokeFunction( String functionName, Object ...args) {        
        return this.invokeMethod(this.globalScope, functionName, args);
    }
    
    public Object invokeMethod(ScriptableObject thiz, String methodName, Object ...args) {        
        Context context = Context.enter();
        try {
            return ScriptableObject.callMethod(thiz, methodName, args);
        }
        catch (Exception e) {
            throw new RuntimeException("An error occurred while trying to invoke method \"" + methodName + "\" in object \"" + thiz + "\". Exception: " + e, e);
        }
        finally
        {
            if (context != null)
            {
                Context.exit();
            }
        }
    }
    
}
