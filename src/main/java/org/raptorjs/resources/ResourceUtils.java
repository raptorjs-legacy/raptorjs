package org.raptorjs.resources;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;

public class ResourceUtils {

    
    public static String getParentPath(String path) {
        int lastSlash = path.lastIndexOf('/');
        if (lastSlash == -1) {
            lastSlash = path.lastIndexOf('\\');
            if (lastSlash == -1) {
                throw new RuntimeException("Path has no parent path: " + path);
            }
        }
        return path.substring(0, lastSlash);
        
    }
    
    public static String resolvePath(String dir, String relativePath) {
        if (relativePath.charAt(0) == '/') {
            return relativePath;
        }
        
        String[] parts = relativePath.split("[/]"); 
        String[] pathParts = dir.split("[/]");
        
        ArrayList<String> pathPartsList = new ArrayList<String>(Arrays.asList(pathParts));
        for (int i=0; i<parts.length; i++) {
            String part = parts[i];
            if (part.equals("..")) {
                pathPartsList.remove(pathParts.length-1);
            }
            else if (part.equals(".")) {
                continue;
            }
            else {
                pathPartsList.add(part);
            }
        }
        
        StringBuilder sb = new StringBuilder();
        Iterator<String> i = pathPartsList.iterator();
        while (i.hasNext()) {
            String pathPart = i.next();
            sb.append(pathPart);
            if (i.hasNext()) {
                sb.append("/");
            }
        }
        return sb.toString(); 
    }
}
