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

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.ServletRequest;

import org.ebayopensource.raptor.raptorjs.resources.Resource;
import org.ebayopensource.raptor.raptorjs.resources.ResourceManager;
import org.ebayopensource.raptor.raptorjs.resources.ResourcesListener;
import org.ebayopensource.raptor.raptorjs.resources.includer.commands.IncludeAsyncPackageCommand;
import org.ebayopensource.raptor.raptorjs.resources.includer.commands.IncludeAsyncPackageCommand.AsyncPackageDependencies;
import org.ebayopensource.raptor.raptorjs.resources.includer.commands.IncludeAsyncPackageCommandBuilder;
import org.ebayopensource.raptor.raptorjs.resources.includer.commands.IncludeCommand;
import org.ebayopensource.raptor.raptorjs.resources.includer.commands.IncludePackageCommand;
import org.ebayopensource.raptor.raptorjs.resources.includer.commands.MissingResourceIncludeCommand;
import org.ebayopensource.raptor.raptorjs.resources.packaging.PackageManifest;
import org.ebayopensource.raptor.raptorjs.resources.packaging.PackageManifest.Include;

public abstract class ResourceIncluder {
    
    private static final String PROVIDER_KEY = "Raptor.ResourceIncluderProvider";
    private static final String INCLUDE_CONTEXT_KEY = "Raptor.ResourceIncluderContext";
    private static final IncludePackageCommand.Builder includePackageCommandBuilder = new IncludePackageCommand.Builder();
    private static final IncludeAsyncPackageCommand.Builder includeAsyncPackageCommandBuilder = new IncludeAsyncPackageCommand.Builder();
    
    public enum ResourceType {
        JS("js.base", "/js"), CSS("css.base", "/css"), IMAGE("image.base", "/images");
        
        private String basePathKey = null;
        private String defaultBasePath = null;
        
        private ResourceType(String basePathKey, String defaultBasePath) {
            this.basePathKey = basePathKey;
            this.defaultBasePath = defaultBasePath;
        }

        public String getBasePathKey() {
            return basePathKey;
        }

        public String getDefaultBasePath() {
            return defaultBasePath;
        }        
    }
    
    
    public static void setProvider(ServletRequest request, ResourceIncluderProvider provider) {
        request.setAttribute(PROVIDER_KEY, provider);
    }
    
    public static ResourceIncluderProvider getProvider(ServletRequest request) {
        ResourceIncluderProvider provider = (ResourceIncluderProvider) request.getAttribute(PROVIDER_KEY);
        if (provider == null) {
            throw new RuntimeException("ResourceIncluder Provider not set for request");
        }
        return provider;
    }
    
    private Map<String, IncludeCommand> includePackageCommandsCache = new ConcurrentHashMap<String, IncludeCommand>();
    private Map<String, IncludeCommand> includeAsyncPackageCommandsCache = new ConcurrentHashMap<String, IncludeCommand>();
    private Map<String, IncludeCommand> includeJSResourceCommandsCache = new ConcurrentHashMap<String, IncludeCommand>();
    private Map<String, IncludeCommand> includeCSSResourceCommandsCache = new ConcurrentHashMap<String, IncludeCommand>();
    
    
    protected ResourceIncluder() {
        ResourceManager.getInstance().addListener(new ResourcesListener() {

            @Override
            public void onResourcesModified() {
                //Clear out the cached commands to include packages and resources since the resources may have changed
                includePackageCommandsCache.clear();
                includeAsyncPackageCommandsCache.clear();
                includeJSResourceCommandsCache.clear();
                includeCSSResourceCommandsCache.clear();
            }
            
        });
    }
    
    public ResourceIncluderContext getResourceIncluderContext(ServletRequest request) {
        ResourceIncluderContext context = (ResourceIncluderContext)request.getAttribute(ResourceIncluder.INCLUDE_CONTEXT_KEY);
        if (context == null) {
            context = this.createIncluderContext(request);
            request.setAttribute(ResourceIncluder.INCLUDE_CONTEXT_KEY, context);
        }
        
        return context;
    }
    
    public ResourceIncluderContext resetResourceIncluderContext(ServletRequest request) {
       	ResourceIncluderContext context = this.createIncluderContext(request);
        request.setAttribute(ResourceIncluder.INCLUDE_CONTEXT_KEY, context);
        return context;
    }
    
    protected abstract ResourceIncluderContext createIncluderContext(ServletRequest request);
    
    public void includeResource(String path, ResourceType resourceType, ServletRequest request) {
        this.includeResource(path, resourceType, ResourceIncludeOptions.DEFAULT_OPTIONS, request);
    }
    
    public void includeResource(String path, ResourceType resourceType, ResourceIncludeOptions includeOptions, ServletRequest request) {
        ResourceIncluderContext context = this.getResourceIncluderContext(request);
        includeResource(path, resourceType, context, includeOptions);
    }
    
    public void includeJSClass(String className, ServletRequest request) {
        this.includeJSClass(className, ResourceIncludeOptions.DEFAULT_OPTIONS, request);
    }
    
    public void includeJSClass(String className, ResourceIncludeOptions includeOptions, ServletRequest request) {
        ResourceIncluderContext context = this.getResourceIncluderContext(request);
        includeJSClass(className, context, includeOptions);
    }
    
    private void includeJSClass(String className, ResourceIncluderContext context, ResourceIncludeOptions includeOptions) {
        String classResourcePath = "/" + className.replace('.', '/') + ".js";
        this.includeResource(classResourcePath, ResourceType.JS, context, includeOptions);
    }
    
    private void includeResource(String path, ResourceType resourceType, ResourceIncluderContext context, ResourceIncludeOptions includeOptions) {
        
        
        if (context.isResourceIncluded(path, resourceType)) {
            return; //Nothing to do, already included
        }
        context.setResourceIncluded(path, resourceType);
        
        

        IncludeCommand includeCommand = this.buildIncludeResourceCommand(path, resourceType, context);
        
        if (includeOptions.isIgnoreMissing() && includeCommand instanceof MissingResourceIncludeCommand) {
            return; //Ignore the problem
        }

        try
        {
            includeCommand.execute(context, includeOptions);
        }
        catch(Exception e) {
            throw new RuntimeException("Unable to include " + resourceType + " resource '" + path + "'. Exception: " + e, e);
        }
    }
    
    public IncludeCommand getCachedIncludeResourceCommand(String path, ResourceType resourceType, ResourceIncluderContext context) {
        IncludeCommand includeCommand;
        
        try
        {
            switch(resourceType) {
                case JS:
                    includeCommand = this.includeJSResourceCommandsCache.get(path);
                    if (includeCommand == null) {
                        includeCommand = this.buildIncludeResourceCommand(path, resourceType, context);
                        this.includeJSResourceCommandsCache.put(path, includeCommand);
                    }
                    break;
                case CSS:
                    includeCommand = this.includeCSSResourceCommandsCache.get(path);
                    if (includeCommand == null) {
                        includeCommand = this.buildIncludeResourceCommand(path, resourceType, context);
                        this.includeCSSResourceCommandsCache.put(path, includeCommand);
                    }
                    break;
                default:
                    throw new RuntimeException("Unsupported resource type: " + resourceType);
            }
        }
        catch(Exception e) {
            throw new RuntimeException("Unable to build include command for " + resourceType + " resource '" + path + "'. Exception: " + e, e);
        }
        return includeCommand;
    }
    
    public IncludeCommand buildIncludeResourceCommand(String path, ResourceType resourceType, ResourceIncluderContext context) {
        IncludeCommand includeCommand;
        try
        {
            Resource resource = ResourceManager.getInstance().findResource(path);
            if (resource == null) {
                includeCommand = new MissingResourceIncludeCommand(
                        path, 
                        new RuntimeException(resourceType + " resource with path '" + path + "' not found."));
            }
            else {
                includeCommand = buildIncludeResourceCommand(
                        resource,
                        resourceType, 
                        context);
            }
            
        }
        catch(Exception e) {
            throw new RuntimeException("Unable to build include resource command for " + resourceType + " resource '" + path + "'. Exception: " + e, e);
        }
        
        return includeCommand;
    }
    
    public void includeModule(String moduleName, PackageIncludeOptions includeOptions, ServletRequest request) {
        ResourceIncluderContext context = this.getResourceIncluderContext(request);
        
        includeModule(moduleName, includeOptions, context);
    }

    public void includeModule(String moduleName, PackageIncludeOptions includeOptions, ResourceIncluderContext context) {
        
        
        IncludeCommand includeModuleCommand = includeOptions.isAsync() ?
                this.getCachedIncludeAsyncModuleCommand(moduleName, context) :
                this.getCachedIncludeModuleCommand(moduleName, context);
                
        assert includeModuleCommand != null;
        
        try
        {
            includeModuleCommand.execute(context, includeOptions);
        }
        catch(Exception e) {
            throw new RuntimeException("Unable to include module '" + moduleName + "'. (includeOptions=" + includeOptions + "). Exception: " + e, e);
        }
    }
    
    protected String getModulePackagePath(String moduleName) {
        return "/" + moduleName.replace('.', '/') + "/package.json";
    }
    
    public void clearCache() {
        if (!this.includePackageCommandsCache.isEmpty()) {
            this.includePackageCommandsCache.clear();    
        }
        
        if (!this.includeAsyncPackageCommandsCache.isEmpty()) {
            this.includeAsyncPackageCommandsCache.clear();    
        }
        
        if (!this.includeJSResourceCommandsCache.isEmpty()) {
            this.includeJSResourceCommandsCache.clear();    
        }
        
        if (!this.includeCSSResourceCommandsCache.isEmpty()) {
            this.includeCSSResourceCommandsCache.clear();    
        }
    }
    
    public IncludeCommand getCachedIncludeModuleCommand(String moduleName, ResourceIncluderContext context) {
        IncludeCommand includeModuleCommand = this.includePackageCommandsCache.get(moduleName);
        if (includeModuleCommand == null) {
            String packagePath = this.getModulePackagePath(moduleName);
            
            includeModuleCommand = this.getCachedIncludePackageCommand(packagePath, context);
            this.includePackageCommandsCache.put(moduleName, includeModuleCommand); //Cache with the module name as well so that we don't have to translate module names to package paths every time
        }
        return includeModuleCommand;
    }
    
    public IncludeCommand getCachedIncludePackageCommand(String packagePath, ResourceIncluderContext context) {
        IncludeCommand includePackageCommand = this.includePackageCommandsCache.get(packagePath);
        if (includePackageCommand == null) {
            try
            {
                includePackageCommand = this.buildIncludePackageCommand(packagePath, context);
                this.includePackageCommandsCache.put(packagePath, includePackageCommand);
            }
            catch(Exception e) {
                throw new RuntimeException("Unable to build include package command for package '" + packagePath + "'. Exception: " + e, e);
            }
        }
        return includePackageCommand;
    }
    
    public IncludeCommand getCachedIncludeAsyncModuleCommand(String moduleName, ResourceIncluderContext context) {
        IncludeCommand includeAsyncModuleCommand = this.includeAsyncPackageCommandsCache.get(moduleName);
        if (includeAsyncModuleCommand == null) {
            String packagePath = this.getModulePackagePath(moduleName);
            
            includeAsyncModuleCommand = this.getCachedIncludeAsyncPackageCommand(moduleName, packagePath, context);
            this.includeAsyncPackageCommandsCache.put(moduleName, includeAsyncModuleCommand); //Cache with the module name as well so that we don't have to translate module names to package paths every time
        }
        return includeAsyncModuleCommand;
    }
    
    public IncludeCommand getCachedIncludeAsyncPackageCommand(String requireName, String packagePath, ResourceIncluderContext context) {
        IncludeCommand includeCommand = this.includeAsyncPackageCommandsCache.get(packagePath);
        if (includeCommand == null) {
            try
            {
                includeCommand = this.getIncludeAsyncPackageCommandBuilder().build(requireName, packagePath, context);
                this.includeAsyncPackageCommandsCache.put(packagePath, includeCommand);
            }
            catch(Exception e) {
                throw new RuntimeException("Unable to build include async package command for package  '" + packagePath + "'. Exception: " + e, e);
            }
        }
        return includeCommand;
    }

    public IncludeCommand buildIncludeModuleCommand(String moduleName, ResourceIncluderContext context) {
        String packagePath = this.getModulePackagePath(moduleName);
        return ResourceIncluder.includePackageCommandBuilder.build(packagePath, context);
    }
    
    public IncludeCommand buildIncludePackageCommand(String packagePath, ResourceIncluderContext context) {
        return ResourceIncluder.includePackageCommandBuilder.build(packagePath, context);
    }
    
    protected IncludeAsyncPackageCommandBuilder getIncludeAsyncPackageCommandBuilder() {
        return includeAsyncPackageCommandBuilder;
    }
    
    public abstract IncludeCommand buildIncludeResourceCommand(Resource resource, ResourceType resourceType, ResourceIncluderContext context);
    public abstract IncludeCommand buildIncludeCommand(Include include, PackageManifest manifest, ResourceIncluderContext context);
    public abstract AsyncPackageDependencies getAsyncPackageDependencies(List<Include> includes, PackageManifest manifest, ResourceIncluderContext context);
    
}
