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

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URI;

public class FileResource extends Resource {

    private File file = null;
    private String url = null;
    public FileResource(String path, SearchPathEntry searchPathEntry, File file) {
        super(path, searchPathEntry);
        this.file = file;
        URI uri = this.file.toURI();
        try {
			this.url = uri.toURL().toExternalForm();
		} catch (MalformedURLException e) {
			throw new RuntimeException(e);
		}
        
    }

    @Override
    public String getURL() {
        return this.url;
    }

    @Override
    public InputStream getResourceAsStream() {
        try {
            return new FileInputStream(file);
        } catch (FileNotFoundException e) {
            throw new RuntimeException("Unable to get input stream for \"" + file.getAbsolutePath() + "\". Exception: " + e, e);
        }
    }
    
    public boolean isFileResource() {
        return true;
    }

    @Override
    public boolean isDirectory() {
        return this.file.isDirectory();
    }

    @Override
    public boolean isFile() {
        return this.file.isFile();
    }

	public File getFile() {
		return file;
	}
    
	public String getFilePath() {
		return this.file.getAbsolutePath();
	}
	
	@Override
	public long lastModified() {
		return this.getFile().lastModified();
	}
    

}
