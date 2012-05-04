package org.ebayopensource.raptorjs.rhino;

import java.io.IOException;
import java.io.InputStream;

public class BootstrapHelper {
    private String basePath = null;
    private RaptorJSEnv raptorJS = null;

    public BootstrapHelper(RaptorJSEnv raptorJS) {
        this.basePath = raptorJS.getCoreModulesDir();
        this.raptorJS = raptorJS;
    }
    
    public void require(String path) {
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        String fullPath =  this.basePath + path;
        
        InputStream in = BootstrapHelper.class.getResourceAsStream(fullPath);
        if (in == null) {
            throw new RuntimeException("Classpath resource not found at path \"" + fullPath + "\"");
        }
        try
        {
            this.raptorJS.getJavaScriptEngine().eval(in, this.basePath + path);
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
