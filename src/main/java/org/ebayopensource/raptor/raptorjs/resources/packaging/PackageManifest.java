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

package org.ebayopensource.raptor.raptorjs.resources.packaging;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.codehaus.jackson.JsonParser;
import org.codehaus.jackson.JsonProcessingException;
import org.codehaus.jackson.JsonToken;
import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.codehaus.jackson.map.DeserializationContext;
import org.codehaus.jackson.map.JsonDeserializer;
import org.codehaus.jackson.map.annotate.JsonDeserialize;
import org.codehaus.jackson.type.TypeReference;
import org.ebayopensource.raptor.raptorjs.resources.Resource;
import org.ebayopensource.raptor.raptorjs.resources.ResourceManager;
import org.ebayopensource.raptor.raptorjs.rhino.JavaScriptEngine;
import org.ebayopensource.raptor.raptorjs.rhino.RaptorJSEnv;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.ScriptableObject;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PackageManifest {
    
    private String name = null;
    private String moduleDirPath = null;
    private String packagePath = null;
    private RaptorJSEnv raptorJSEnv = null;
    @JsonDeserialize(contentAs=Include.class)
    public List<Include> includes = null;
    private Extensions extensions = null;
    
    public PackageManifest() {
    }
    
    public void init(RaptorJSEnv raptorJSEnv) {
        this.raptorJSEnv = raptorJSEnv;
        
        
        if (this.extensions == null) {
            this.extensions = new Extensions();
        }
        
        if (this.includes != null) {
            
            Extension defaultExtension = new Extension();
            defaultExtension.setName("");
            if (this.includes != null) { 
                defaultExtension.includes = this.includes;
            }
            this.extensions.extensions.add(0, defaultExtension);
        }
        
        if (this.extensions != null) {
            this.extensions.init(this);
        }
    }
    
    public void forEachExtension(ExtensionCallback callback) {
        if (this.extensions != null) {
            for (Extension ext : this.extensions.extensions) {
                callback.handleExtension(ext);
            }
        }
        
    }
    
    public List<Include> getIncludes() {
        return this.includes;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String moduleName) {
        this.name = moduleName;
    }
    
    public void setIncludes(List<Include> includes) {
        this.includes = includes;
    }
    
    public void setExtensions(Extensions extensions) {
        this.extensions = extensions;
    }

    @Override
    public String toString() {
        return "ModuleManifest [name=" + name + ", includes=" + includes + "]";
    }
    
    public Resource resolveResource(String path) {
        String fullPath = path.startsWith("/") ? 
                path :
                this.getModuleDirPath() + "/" + path;
        
        Resource resource = ResourceManager.getInstance().findResource(fullPath);
        if (resource == null) {
            throw new RuntimeException("Include with path '" + path + "' (" + fullPath + ") not found for packge '" + this.packagePath + "'.");
        }
        return resource;
    }
    public String getModuleDirPath() {
        return moduleDirPath;
    }

    public void setModuleDirPath(String moduleDirPath) {
        this.moduleDirPath = moduleDirPath;
    }
    
    

    public String getPackagePath() {
        return packagePath;
    }

    public void setPackagePath(String packagePath) {
        this.packagePath = packagePath;
    }



    public static class IncludeDeserializer extends JsonDeserializer<Include>{
        private static final String TYPE_MODULE_INCLUDE = "module";
        private static final String TYPE_JS_INCLUDE = "js";
        private static final String TYPE_CSS_INCLUDE = "css";
        
        @Override
        public Include deserialize(JsonParser parser, DeserializationContext ctxt)
                throws IOException, JsonProcessingException {
            
            TypeReference<HashMap<String,String>>  typeRef = new TypeReference<HashMap<String,String>>() {};
             
            HashMap<String, String> properties 
                = parser.readValueAs(typeRef);
            
            Include include = new Include();
            include.type = properties.get("type");
            
            include.path = properties.get("path");
            
            if ("module".equals(include.type)) {
                include.moduleName = properties.get("name");
            }
            
            if (TYPE_JS_INCLUDE.equals(include.type)) {
                include._isJS = true;                
            }
            else if (TYPE_CSS_INCLUDE.equals(include.type)) {
                include._isCSS = true;                
            }
            else if (TYPE_MODULE_INCLUDE.equals(include.type)) {
                include._isModule = true;                
            }
            
            
            if (include._isModule) {
                include.moduleName = properties.get("name");
            }
            
            include.properties = properties;
            
            return include;
        }
        
    }

    @JsonDeserialize(using = IncludeDeserializer.class)
    public static class Include {
        
        
        private String type = null;
        private String path = null;
        private String moduleName = null; 
        private Map<String, String> properties = null;
        
        private boolean _isModule = false;
        private boolean _isJS = false;
        private boolean _isCSS = false;
        
        public boolean isModuleInclude() {
            return this._isModule;
        }
        
        public boolean isJavaScriptInclude() {
            return this._isJS;
        }
        
        public boolean isStyleSheetInclude() {
            return this._isCSS;
        }
        
        public String getType() {
            return type;
        }
        public void setType(String type) {
            this.type = type;
        }

        public String getPath() {
            return path;
        }
        public void setPath(String path) {
            this.path = path;
        }

        
        public String getModuleName() {
            return moduleName;
        }

        public void setModuleName(String name) {
            this.moduleName = name;
        }
        
        

        public Map<String, String> getProperties() {
            return properties;
        }

        @Override
        public String toString() {
            return "Include [type=" + type + ", path=" + path + ", moduleName="
                    + moduleName + "]";
        }
        
        

    }
    
    
    public static class ExtensionsDeserializer extends JsonDeserializer<Extensions>{

        
        @Override
        public Extensions deserialize(JsonParser parser, DeserializationContext ctxt)
                throws IOException, JsonProcessingException {
            
            Extensions extensions = new Extensions();
            JsonToken currentToken = parser.getCurrentToken();
            
            switch(currentToken) {
                case START_OBJECT:
                {
                    TypeReference<Map<String, Extension>>  typeRef = new TypeReference<Map<String, Extension>>() {};
                    
                    Map<String, Extension> extensionMap = parser.readValueAs(typeRef); //mapper.readValue(parser, typeRef);
                    
                    for (Map.Entry<String, Extension> entry : extensionMap.entrySet()) {
                        Extension extension = entry.getValue();
                        String name = entry.getKey();
                        extension.setName(name);
                        extensions.add(extension);
                    }
                    break;
                }
                case START_ARRAY:
                {
                    TypeReference<List<Extension>>  typeRef = new TypeReference<List<Extension>>() {};
                    List<Extension> extensionList = parser.readValueAs(typeRef);
                    for ( Extension extension : extensionList) {
                        if (extension.getName() == null) {
                            throw new RuntimeException("Extension name is required");
                        }
                        extensions.add(extension);
                    }
                    break;
                }
            }
            return extensions;
        }
        
    }

    @JsonDeserialize(using = ExtensionsDeserializer.class)
    public static class Extensions {

        private List<Extension> extensions = new ArrayList<Extension>();
        
        private void init(PackageManifest manifest) {
            Collections.sort(this.extensions);
            
            for (Extension extension : this.extensions) {
                extension.init(manifest);
            }
        }

        private void add(Extension extension) {
            this.extensions.add(extension);
        }
    }
    
    public static class Extension implements Comparable<Extension> {
        

        @Override
        public int hashCode() {
            final int prime = 31;
            int result = 1;
            result = prime * result
                    + ((name == null) ? 0 : name.hashCode());
            return result;
        }



        @Override
        public boolean equals(Object obj) {
            if (this == obj)
                return true;
            if (obj == null)
                return false;
            if (getClass() != obj.getClass())
                return false;
            Extension other = (Extension) obj;
            if (name == null) {
                if (other.name != null)
                    return false;
            } else if (!name.equals(other.name))
                return false;
            return true;
        }

        @JsonDeserialize(contentAs=Include.class)
        public List<Include> includes = null;
        private String conditionStr = null;
        private Condition condition = null;
        private String name = null;
        
        public boolean isDefault() {
            return this.name.length() == 0;
        }

        public List<Include> getIncludes() {
            return includes;
        }

        

        public String getCondition() {
            return conditionStr;
        }



        public void setCondition(String conditionStr) {
            this.conditionStr = conditionStr;
            
        }
        
        protected void init(PackageManifest manifest) {
            if (this.conditionStr != null) {
                this.condition = new Condition(manifest, this.conditionStr, this.name);
            }
        }



        public String getName() {
            return name;
        }

        public boolean checkCondition(ScriptableObject extensionCollection){
            return this.condition.checkCondition(extensionCollection);
        }


        public void setName(String name) {
            this.name = name;
        }
        
        public boolean hasCondition() {
            return this.condition != null;
        }

        @Override
        public String toString() {
            return "Extension [includes=" + includes + "]";
        }


        public void forEachInclude(IncludeCallback callback) {
            if (this.includes != null) {
                for (Include include : this.includes) {
                    callback.handleInclude(include, this);
                }
            }
            
        }

        @Override
        public int compareTo(Extension o) {
            String thisExtensionName = this.name != null ? this.name : "";
            String otherExtensionName = o.name != null ? o.name : "";
            return thisExtensionName.compareTo(otherExtensionName);
        }
        
        
    }

    public static interface IncludeCallback {
        void handleInclude(Include include, Extension extension);
    }
    
    public static interface ExtensionCallback {
        void handleExtension(Extension extension);
    }
    
    public static class ModuleInclude {
        private String moduleName = null;
        private String extension = null;
        
        public ModuleInclude(String moduleName, String extension) {
            super();
            this.moduleName = moduleName;
            this.extension = extension;
        }


        public String getModuleName() {
            return moduleName;
        }
        
        
        

        public String getExtension() {
            return extension;
        }


        @Override
        public String toString() {
            return "ModuleInclude [moduleName=" + moduleName + ", extension="
                    + extension + "]";
        }
    }
    
    public static class ResourceInclude {
        private Resource resource = null;
        private String extension = null;

        public ResourceInclude(Resource resource, String extension) {
            super();
            this.resource = resource;
            this.extension = extension;
        }

        public Resource getResource() {
            return resource;
        }



        public String getExtension() {
            return extension;
        }

        @Override
        public String toString() {
            return "ResourceInclude [resource=" + resource + ", extension="
                    + extension + "]";
        }
    }
    

    private static class Condition {
        private NativeFunction function = null;
        private PackageManifest manifest = null;
        
        private Condition(PackageManifest manifest, String conditionStr, String extensionName) {
            this.manifest = manifest;
            
            this.function = (NativeFunction)manifest.raptorJSEnv.getJavaScriptEngine().eval(
                    "(function (extensions) { return " + conditionStr + ";})", 
                    manifest.packagePath + "/" + extensionName);
        }
        
        protected boolean checkCondition(ScriptableObject extensionCollection) {
            JavaScriptEngine jsEngine = manifest.raptorJSEnv.getJavaScriptEngine();
            Boolean result =  (Boolean)jsEngine.invokeFunction(this.function, extensionCollection);
            return result.booleanValue();
        }
        
    }
    
}
