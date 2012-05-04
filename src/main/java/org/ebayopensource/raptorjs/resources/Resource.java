package org.ebayopensource.raptorjs.resources;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringWriter;

public abstract class Resource {

    private String path = null;
    
    public Resource(String path) {
        this.path = path;
    }
    
    public String getPath() {
        return path;
    }
    public void setPath(String path) {
        this.path = path;
    }
    
    public abstract boolean isDirectory();
    public abstract boolean isFile();
    public abstract String getSystemPath();
    public abstract InputStream getResourceAsStream();
    
    public String readAsString() {
        return this.readAsString("UTF-8");
    }
    
    public String readAsString(String charset) {
        if (charset == null) charset = "UTF-8";
        
        try
        {
            Reader reader = new InputStreamReader(new BufferedInputStream(this.getResourceAsStream()));
            StringWriter out = new StringWriter();
            char[] buffer = new char[4096];
            try
            {
                int len;
                while ((len = reader.read(buffer)) != -1)
                {
                    out.write(buffer, 0, len);
                }
            }
            finally
            {
                if (reader != null) reader.close();
                if (out != null) out.close();
            }
            return out.toString();
        }
        catch (IOException e)
        {
            throw new RuntimeException("Unable to read resource as string \"" + this.getSystemPath() + "\" (charset=" + charset + "). Exception: " + e, e);
        } 
    }
    
}
