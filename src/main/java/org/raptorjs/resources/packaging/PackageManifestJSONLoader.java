package org.raptorjs.resources.packaging;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;

import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.JsonProcessingException;
import org.codehaus.jackson.map.DeserializationConfig;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.node.ArrayNode;
import org.codehaus.jackson.node.ObjectNode;
import org.codehaus.jackson.node.TextNode;
import org.raptorjs.resources.Resource;

public class PackageManifestJSONLoader {
    
    private ObjectMapper mapper = new ObjectMapper();
    private IncludeFactory includeFactory = null;
    
    public PackageManifestJSONLoader(IncludeFactory includeFactory) {
        this.includeFactory = includeFactory;
   
        mapper.configure(DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }
    
    
    public PackageManifest load(Resource resource) {
        
        InputStream in = resource.getResourceAsStream();
        try
        {   
        	PackageManifest manifest = new PackageManifest();
        	manifest.setResource(resource);
        	this.load(manifest, in);
        	
            return manifest;
        }
        catch(Exception e) {
        	throw new RuntimeException("Unable to parse JSON file at path '" + resource.getSystemPath() + "'. Exception: " + e, e);
        }
    }
    
    public void load(PackageManifest manifest, InputStream in) throws JsonProcessingException, IOException {

    	ObjectNode root = (ObjectNode)mapper.readTree(in);
        deserializeRoot(manifest, root);
    }
    
    private void deserializeRoot(PackageManifest manifest, ObjectNode root) {
        manifest.setName(root.get("name") != null ? root.get("name").getValueAsText() : null);
        
        if (root.has("raptor")) {
        	ObjectNode raptorObj = (ObjectNode) root.get("raptor");
        	deserializeRaptor(manifest, raptorObj);
        }
        else {
        	deserializeRaptor(manifest, root);
        }
        
    }
    
    private void deserializeRaptor(PackageManifest manifest, ObjectNode raptor) {
    	ArrayNode includes = (ArrayNode) raptor.get("includes");
        if (includes != null) {
            for (int i=0; i<includes.size(); i++) {
                JsonNode includeNode = includes.get(i);
                Include include = this.deserializeInclude(manifest, includeNode);
                manifest.addInclude(include);
            }
            
        }
        
        JsonNode extensionsNode = raptor.get("extensions");
        if (extensionsNode != null) {
            if (extensionsNode.isArray()) {
                ArrayNode extensionsArrayNode = (ArrayNode) extensionsNode;
                for (int i=0; i<extensionsArrayNode.size(); i++) {

                    ObjectNode extensionObjectNode = (ObjectNode) extensionsArrayNode.get(i);
                    Extension extension = new Extension();
                    
                    if (extensionObjectNode.get("name") != null) {
                        extension.setName(extensionObjectNode.get("name").getValueAsText());
                    }
                    this.deserializeExtension(manifest, extension, extensionObjectNode);
                    manifest.addExtension(extension);
                }
            }
            else if (extensionsNode.isObject()) {
                Iterator<Entry<String, JsonNode>> iterator = extensionsNode.getFields();
                while (iterator.hasNext()) {
                    Extension extension = new Extension();
                    
                    Entry<String, JsonNode> field = iterator.next();
                    String extensionName = field.getKey();
                    extension.setName(extensionName);
                    ObjectNode extensionObjectNode = (ObjectNode) field.getValue();
                    this.deserializeExtension(manifest, extension, extensionObjectNode);
                    manifest.addExtension(extension);
                }
            }
            else {
                throw new RuntimeException("Invalid extensions: " + extensionsNode);
            }
        }
    }
    
    private void deserializeExtension(PackageManifest manifest, Extension extension, ObjectNode node) {
        TextNode conditionNode = (TextNode) node.get("condition");
        if (conditionNode != null) {
            Condition condition = new Condition(conditionNode.getValueAsText(), manifest.getPackagePath() != null ? manifest.getPackagePath() + "/" + extension.getName() : null);
            extension.setCondition(condition);
        }
        
        ArrayNode includes = (ArrayNode) node.get("includes");
        if (includes != null) {
            for (int i=0; i<includes.size(); i++) {
                JsonNode includeNode = includes.get(i);
                Include include = this.deserializeInclude(manifest, includeNode);
                extension.addInclude(include);
            }
        }
    }
    
    private Include deserializeInclude(PackageManifest manifest, JsonNode node) {
        String type = null;
        Map<String, Object> props = new HashMap<String, Object>();
        
        if (node.isObject()) {
            ObjectNode objectNode = (ObjectNode) node;
            Iterator<Entry<String, JsonNode>> iterator = objectNode.getFields();
            while (iterator.hasNext()) {
                Entry<String, JsonNode> field = iterator.next();
                String name = field.getKey();
                JsonNode valueNode = field.getValue();
                Object value = null;
                
                if (valueNode.isBoolean()) {
                    value = valueNode.getValueAsBoolean();
                }
                else if (valueNode.isTextual()) {
                    value = valueNode.getValueAsText();
                }
                else if (valueNode.isInt()) {
                    value = Integer.valueOf(valueNode.getIntValue());
                }
                else if (valueNode.isDouble()) {
                    value = Double.valueOf(valueNode.getDoubleValue());
                }
                else {
                    throw new RuntimeException("Unsupported include property value: " + valueNode);
                }
                
                props.put(name, value);
            }
            
            type = (String) props.get("type");
            if (type == null) {
                String path = (String) props.get("path");
                if (path != null) {
                    type = path.substring(path.lastIndexOf('.')+1);
                }
                else {
                    String moduleName = (String) props.get("module");
                    if (moduleName != null) {
                        type = "module";
                        props.put("name", moduleName);
                    }
                    else {
                        String packagePath = (String) props.get("package");
                        if (packagePath != null) {
                            type = "package";
                            props.put("package", packagePath);
                        }
                    }
                }
                props.put("type", type);
                
            }
            
            if (type == null) {
                throw new RuntimeException("Type is required for include: " + node);
            }
        }
        else if (node.isTextual()) {
            String path = node.getValueAsText();
            int lastDot = path.lastIndexOf('.');
            if (lastDot != -1) {
                type = path.substring(lastDot+1);
                props.put("type", type);
                props.put("path", path);    
            }
            else {
                props.put("type", "module");
                props.put("name", path);
            }
        }
        
        if (props.isEmpty()) {
            props = Collections.emptyMap();
        }
        
        Include include = this.includeFactory.createInclude(type, props);
        include.setParentPackageManifest(manifest);
        return include;
    }
}
