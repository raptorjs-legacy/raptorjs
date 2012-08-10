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
import java.util.Dictionary;

import org.osgi.framework.Bundle;
import org.raptorjs.resources.Resource;

public class BundleResource extends Resource {
    
    private Bundle bundle = null;
    private String fullPath = null;
    private URL url = null;
    
    protected BundleResource(String path, Bundle bundle, String fullPath, URL url) {
        super(path);
        this.bundle = bundle;
        this.fullPath = fullPath;
        this.url = url;
    }

    public Bundle getBundle() {
        return bundle;
    }

    public String getFullPath() {
        return fullPath;
    }

    public URL getUrl() {
        return url;
    }

    @Override
    public String getSystemPath() {
        // TODO Auto-generated method stub
        return fullPath + " (bundle=" + bundle.getSymbolicName() + ")";
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
        Dictionary<?, ?> headers = bundle.getHeaders();
        String headerValue = (String) headers.get(name);
        return headerValue;
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
