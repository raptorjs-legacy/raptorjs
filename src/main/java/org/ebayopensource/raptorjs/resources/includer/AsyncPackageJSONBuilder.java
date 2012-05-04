package org.ebayopensource.raptorjs.resources.includer;

import java.util.Iterator;
import java.util.List;

import org.ebayopensource.raptorjs.resources.includer.commands.IncludeAsyncPackageCommand.AsyncPackageDependencies;

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
