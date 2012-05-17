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

import java.util.Iterator;
import java.util.List;

import org.ebayopensource.raptor.raptorjs.resources.includer.commands.IncludeAsyncPackageCommand.AsyncPackageDependencies;

public class AsyncPackageJSONBuilder {

    private static AsyncPackageJSONBuilder instance = new AsyncPackageJSONBuilder();

    
    
    public static AsyncPackageJSONBuilder getInstance() {
        return instance;
    }

    public String buildJSON(
            AsyncPackageDependencies dependencies
        ) {
        
        List<String> requires = dependencies.getRequires();
        List<String> jsUrls = dependencies.getJsUrls();
        List<String> cssUrls = dependencies.getCssUrls();
        
        boolean commaRequired = false;
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        if (requires != null && requires.size() > 0) {
            sb.append("\"requires\":");
            serialize(sb, requires);  
            commaRequired = true;
        }
        
        if (jsUrls != null && jsUrls.size() > 0) {
            if (commaRequired) {
                sb.append(",");    
            }
            sb.append("\"js\":");
            serialize(sb, jsUrls);
            commaRequired = true;
        }
        
        if (cssUrls != null && cssUrls.size() > 0) {
            if (commaRequired) {
                sb.append(",");    
            }
            sb.append("\"css\":");
            serialize(sb, cssUrls);
        }

        sb.append('}');
        return sb.toString();
    }
    
    private void serialize(StringBuilder sb, List<String> list) {
        Iterator<String> i = list.iterator();
        
        sb.append("[");
        while (i.hasNext()) {

            String str = i.next();
            sb.append('"');
            sb.append(str);
            sb.append('"');
            if (i.hasNext()) {
                sb.append(",");
            }
        }
        sb.append("]");
    }
}
