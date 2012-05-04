package org.ebayopensource.raptorjs.resources.includer;

import java.io.IOException;
import java.io.Writer;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class AsyncRequiresMetadataCollection {
    private Map<String, String> moduleJSONByName = new HashMap<String, String>();
    
    public void setModuleJSON(String moduleName, String metadataJSON) {
        moduleJSONByName.put(moduleName, metadataJSON);
    }
    
    public boolean isEmpty() {
        return moduleJSONByName == null || moduleJSONByName.isEmpty();
    }
    
    public void writeJSON(Writer out) throws IOException {
        if (moduleJSONByName == null || moduleJSONByName.isEmpty()) return;
        
        Iterator<Map.Entry<String, String>> i = moduleJSONByName.entrySet().iterator();
        out.write("_asyncModules={");
        while (i.hasNext()) {
            Map.Entry<String, String> entry = i.next();
            String moduleName = entry.getKey();
            String json = entry.getValue();
            
            out.write("\"");
            out.write(moduleName);
            out.write("\": ");
            out.write(json);
            
            if (i.hasNext()) {
                out.write(",");
            }
        }
        out.write("};");
    }
}
