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

package org.raptorjs.resources.osgi;

import java.io.InputStream;
import java.net.URL;

import org.osgi.framework.Bundle;
import org.raptorjs.resources.Resource;
import org.raptorjs.resources.SearchPathEntry;

public class BundleResource extends Resource {
    
    private Bundle bundle = null;
    private String fullPath = null;
    private URL url = null;
    private String urlString = null;
    
    protected BundleResource(String path, SearchPathEntry searchPathEntry, Bundle bundle, String fullPath, URL url) {
        super(path, searchPathEntry);
        this.bundle = bundle;
        this.fullPath = fullPath;
        this.url = url;
        
        this.urlString = url.toExternalForm();
    }

    public Bundle getBundle() {
        return bundle;
    }

    public String getFullPath() {
        return fullPath;
    }

    @Override
    public String getURL() {
    	return this.urlString;
    }

    @Override
    public InputStream getResourceAsStream() {
        try {
            return this.url.openStream();
        } catch (Exception e) {
            throw new RuntimeException("Unable to open URL '" + this.url + "' as stream for resource '" + this.fullPath + "' in bundle '" + bundle.getSymbolicName() + "'");
        }
    }

    @Override
    public String toString() {
        return "BundleResource [fullPath=" + fullPath + ", bundle=" + bundle.getSymbolicName() + "]";
    }
    
    public String getBundleHeader(String name) {
        Object value = bundle.getHeaders().get(name);
        return value == null ? null : value.toString();
    }

    @Override
    public boolean isDirectory() {
        return false;
    }

    @Override
    public boolean isFile() {
        return true;
    }
    
    
}
