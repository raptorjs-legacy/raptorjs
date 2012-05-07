package org.ebayopensource.raptor.raptorjs.resources;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;

public class URLResource extends Resource {

    private URL url = null;
    private boolean isFile = true;

    public URLResource(String path, URL url, boolean isFile) {
        super(path);
        this.url = url;
        this.isFile = true;
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
    
    

}
