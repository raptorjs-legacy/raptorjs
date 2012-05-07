package org.ebayopensource.raptor.raptorjs.resources;

import java.io.File;

public class DirSearchPathEntry extends SearchPathEntry {

    private File dir = null;
    
    public DirSearchPathEntry(File dir) {
        this.dir = dir;
    }
    
    @Override
    public Resource findResource(String path) {
        File file = new File(dir, path);
        if (file.exists()) {
            return new FileResource(path, file);
        }
        return null;
    }

}
