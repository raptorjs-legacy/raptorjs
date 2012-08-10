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

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.io.StringWriter;

public class FilesHelper {
    public FilesHelper(RaptorJSEnv raptorJS) {
        
    }
    
    public String readFully(File file, String charset)
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
