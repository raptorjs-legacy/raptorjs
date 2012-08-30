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

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;

public class URLResource extends Resource {

    private URL url = null;
    private boolean isFile = true;
    private String fullPath;
    private Boolean exists = null;

    public URLResource(String path, SearchPathEntry searchPathEntry, String fullPath, URL url, boolean isFile) {
        super(path, searchPathEntry);
        this.url = url;
        this.isFile = true;
        this.fullPath = fullPath;
    }

    public String getFullPath() {
        return fullPath;
    }

    @Override
    public boolean isDirectory() {
        return !this.isFile();
    }

    @Override
    public boolean isFile() {
        return this.isFile;
    }

    @Override
    public String getSystemPath() {
        return url.toString();
    }

    @Override
    public InputStream getResourceAsStream() {
        try {
            return url.openStream();
        } catch (IOException e) {
            throw new RuntimeException("Unable to open resource \"" + this.url + "\" as stram. Exception: " + e, e);
        }
    }

    @Override
    public String toString() {
        return "URLResource [url=" + url + ", isFile=" + isFile + "]";
    }

    public URL getUrl() {
        return url;
    }
}
