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

package org.raptorjs.resources.packaging;

import java.io.IOException;
import java.io.Writer;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class AsyncMetadata {
    private Map<String, AsyncDependencies> asyncDependenciesByName = new HashMap<String, AsyncDependencies>();
    
    public void setAsyncDependencies(String requireName, AsyncDependencies asyncDependencies) {
        asyncDependenciesByName.put(requireName, asyncDependencies);
    }
    
    public AsyncDependencies getAsyncDependencies(String requireName) {
        return this.asyncDependenciesByName.get(requireName);
    }
    
    public boolean isEmpty() {
        return asyncDependenciesByName == null || asyncDependenciesByName.isEmpty();
    }
    
    public boolean hasRequires(String requiresName) {
        return this.asyncDependenciesByName.containsKey(requiresName);
    }
    
    public void writeJSON(Writer out) throws IOException {
        
        
        if (asyncDependenciesByName == null || asyncDependenciesByName.isEmpty()) return;
        AsyncPackageJSONBuilder jsonBuilder = AsyncPackageJSONBuilder.getInstance();
        
        Iterator<Map.Entry<String, AsyncDependencies>> i = asyncDependenciesByName.entrySet().iterator();
        out.write("$rset('loaderMeta',{");
        while (i.hasNext()) {
            Map.Entry<String, AsyncDependencies> entry = i.next();
            String requireName = entry.getKey();
            AsyncDependencies asyncDependencies = entry.getValue();
            String json = jsonBuilder.buildJSON(asyncDependencies);
            
            out.write("\"");
            out.write(requireName);
            out.write("\": ");
            out.write(json);
            
            if (i.hasNext()) {
                out.write(",");
            }
        }
        out.write("});");
    }

	@Override
	public String toString() {
		return "AsyncMetadata [asyncDependenciesByName="
				+ asyncDependenciesByName + "]";
	}
    
    
}
