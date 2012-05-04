package org.ebayopensource.raptorjs.rhino;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.io.StringWriter;

public class FilesHelper {
    public FilesHelper(RaptorJSEnv raptorJS) {
        
    }
    
    public String readFile(File file, String charset)
    {        
        if (charset == null) charset = "UTF-8";
        
        try
        {
            Reader in = new FileReader(file);
            StringWriter out = new StringWriter();
            char[] buffer = new char[4096];
            try
            {
                int len;
                while ((len = in.read(buffer)) != -1)
                {
                    out.write(buffer, 0, len);
                }
            }
            finally
            {
                if (in != null) in.close();
                if (out != null) out.close();
            }
            return out.toString();
        }
        catch (IOException e)
        {
            throw new RuntimeException("Unable to read file \"" + file + "\". Exception: " + e, e);
        }        
    }
}
