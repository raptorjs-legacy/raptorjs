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

package org.raptorjs.resources;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringWriter;

public abstract class Resource {

    private String path = null;
    private SearchPathEntry searchPathEntry = null;
    
    public Resource(String path, SearchPathEntry searchPathEntry) {
        this.path = path;
        this.searchPathEntry = searchPathEntry;
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
    public void watch(WatchListener listener) {
    	//Not implemented
    }
    
    public Resource resolve(String relPath) {
        String basePath;
        
        if (this.isDirectory()) {
            basePath = this.getPath();
        }
        else {
            basePath = ResourceUtils.getParentPath(this.getPath());
        }
        
        String resolvedPath = ResourceUtils.resolvePath(basePath, relPath);
        Resource resolvedResource = this.getSearchPathEntry().findResource(resolvedPath);
        return resolvedResource;
    }
    
    public String getParentPath() {
        int lastSlash = this.path.lastIndexOf('/');
        if (lastSlash == -1) {
            return "/";
        }
        else {
            return this.path.substring(0, lastSlash);
        }
    }
    
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

    public SearchPathEntry getSearchPathEntry() {
        return searchPathEntry;
    }

    public void setSearchPathEntry(SearchPathEntry searchPathEntry) {
        this.searchPathEntry = searchPathEntry;
    }
 
    
}
