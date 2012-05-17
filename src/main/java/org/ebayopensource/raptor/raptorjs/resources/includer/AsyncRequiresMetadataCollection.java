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

package org.ebayopensource.raptor.raptorjs.resources.includer;

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
