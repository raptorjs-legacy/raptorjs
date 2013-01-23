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

import java.io.IOException;
import java.io.InputStream;

public class BootstrapRhinoHelper {
    private String basePath = null;
    private RaptorJSEnv raptorJS = null;

    public BootstrapRhinoHelper(RaptorJSEnv raptorJS) {
        this.basePath = raptorJS.getCoreModulesDir();
        this.raptorJS = raptorJS;
    }
    
    public void require(String path) {
        
                
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        String fullPath =  this.basePath + path;
        
        InputStream in = BootstrapRhinoHelper.class.getResourceAsStream(fullPath);
        if (in == null) {
            throw new RuntimeException("Classpath resource not found at path \"" + fullPath + "\"");
        }
        try
        {
            
            this.raptorJS.getJavaScriptEngine().eval(in, fullPath);
        }
        catch(Exception e) {
            throw new RuntimeException("Unable to require \"" + path + "\". Exception: " + e, e);
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
}
