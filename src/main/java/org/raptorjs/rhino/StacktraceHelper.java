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
