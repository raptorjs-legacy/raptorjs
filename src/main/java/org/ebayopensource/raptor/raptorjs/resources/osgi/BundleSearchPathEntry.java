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

package org.ebayopensource.raptor.raptorjs.resources.osgi;

import java.net.URL;

import org.ebayopensource.raptor.raptorjs.resources.Resource;
import org.ebayopensource.raptor.raptorjs.resources.SearchPathEntry;
import org.osgi.framework.Bundle;

public class BundleSearchPathEntry extends SearchPathEntry {

    private Bundle bundle = null;
    private String basePath = null;
    
    public BundleSearchPathEntry(Bundle bundle, String basePath) {
        this.bundle = bundle;
        this.basePath = basePath;
    }
    
    @Override
    public Resource findResource(String path) {
        
        if (this.bundle.getState() != Bundle.ACTIVE) return null;
        
        String fullPath = ("/".equals(this.basePath) ? "" : this.basePath) + path;
        
        URL resourceURL = this.bundle.getResource(fullPath);
        if (resourceURL != null) {
            return new BundleResource(path, this.bundle, fullPath, resourceURL);
        }
        return null;
    }

    @Override
    public String toString() {
        return "BundleSearchPathEntry [bundle=" + bundle.getSymbolicName() + " (" + bundle.getBundleId() + ")" + ", basePath="
                + basePath + "]";
    }
    
    
}
