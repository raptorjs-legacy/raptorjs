package org.ebayopensource.raptorjs.resources;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;

public class FileResource extends Resource {

    private File file = null;
    
    public FileResource(String path, File file) {
        super(path);
        this.file = file;
    }

    @Override
    public String getSystemPath() {
        return this.file.getAbsolutePath();
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

}
