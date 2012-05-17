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

package org.ebayopensource.raptor.raptorjs.resources.includer.commands;

import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;

import org.ebayopensource.raptor.raptorjs.resources.includer.AsyncPackageJSONBuilder;
import org.ebayopensource.raptor.raptorjs.resources.includer.PackageIncludeOptions;
import org.ebayopensource.raptor.raptorjs.resources.includer.ResourceIncludeOptions;
import org.ebayopensource.raptor.raptorjs.resources.includer.ResourceIncluderContext;
import org.ebayopensource.raptor.raptorjs.resources.packaging.PackageManifest;
import org.ebayopensource.raptor.raptorjs.resources.packaging.PackageManifest.Extension;
import org.ebayopensource.raptor.raptorjs.resources.packaging.PackageManifest.ExtensionCallback;
import org.ebayopensource.raptor.raptorjs.resources.packaging.PackageManifest.Include;


public class IncludeAsyncPackageCommand implements IncludeCommand {
    
    //private Map<Set<String>, AsyncPackageDependencies> packageDependenciesByExtensionsCache = new ConcurrentHashMap<Set<String>, AsyncPackageDependencies>();
    
    private String requireName = null;
    private String packagePath = null;
    private PackageManifest packageManifest = null;
    
    public IncludeAsyncPackageCommand(
            String requireName,
            String packagePath,
            PackageManifest packageManifest) {
        this.requireName = requireName;
        this.packagePath = packagePath;
        this.packageManifest = packageManifest;
        
    }



    @Override
    public void execute(final ResourceIncluderContext context, final ResourceIncludeOptions includeOptions) {
        
        PackageIncludeOptions packageIncludeOptions = null;
        
        if (includeOptions instanceof PackageIncludeOptions) {
            packageIncludeOptions = (PackageIncludeOptions) includeOptions;
        }
         
        final PackageIncludeOptions finalPackageIncludeOptions = packageIncludeOptions;
        final Set<Extension> enabledExtensionsMap = new HashSet<Extension>();
        final List<Extension> enabledExtensions = new LinkedList<Extension>();
        final Set<Extension> alreadyIncludedExtensions = context.getIncludedAsyncPackageExtensions(this.packagePath);
        this.packageManifest.forEachExtension(new ExtensionCallback() {

            @Override
            public void handleExtension(Extension extension) {
                if (enabledExtensionsMap.contains(extension)) {
                    return;
                }
                
                if (extension.getIncludes() != null && (alreadyIncludedExtensions.contains(extension) || context.isExtensionEnabled(extension, finalPackageIncludeOptions))) {
                    enabledExtensionsMap.add(extension);
                    enabledExtensions.add(extension);
                }
            }
            
        });
        
        
        
        if (context.isAsyncPackageIncluded(requireName, enabledExtensionsMap)) {
            return;
        }
        
        AsyncPackageDependencies dependencies = this.buildDependencies(context, enabledExtensions);
        
        List<IncludeCommand> requiresIncludeCommands = dependencies.getIncludeCommands();
        if (requiresIncludeCommands != null) {
            for (IncludeCommand includeCommand : requiresIncludeCommands) {
                includeCommand.execute(context, packageIncludeOptions);
            }
        }

        context.setAsyncRequireJSON(requireName, dependencies.toJSON());
        
        //Mark the async module as included
        context.setAsyncPackageIncluded(requireName, enabledExtensionsMap);
    }
    
    protected AsyncPackageDependencies buildDependencies(final ResourceIncluderContext context, List<Extension> enabledExtensions) {
        final List<Include> includes = new LinkedList<Include>();
        
        for (Extension enabledExtension : enabledExtensions) {
            includes.addAll(enabledExtension.getIncludes());
        }
        
        AsyncPackageDependencies dependencies = context.getResourceIncluder().getAsyncPackageDependencies(includes, this.packageManifest, context);
        return dependencies;
    }

    @Override
    public String toString() {
        return "IncludeAsyncPackageCommand [packagePath=" + packagePath + "]";
    }

    public static class AsyncPackageDependencies {
        private List<String> jsUrls = new LinkedList<String>();
        private List<String> cssUrls = new LinkedList<String>();
        private List<String> requires = new LinkedList<String>();
        private List<IncludeCommand> includeCommands = new LinkedList<IncludeCommand>();
        
        private String json = null;
        
        public void addJavaScriptUrl(String url) {
            this.jsUrls.add(url);
        }
        public void addAllJavaScriptUrls(List<String> urls) {
            this.jsUrls.addAll(urls);
        }
        
        public void addStyleSheetUrl(String url) {
            this.cssUrls.add(url);
        }
        
        public void addAllStyleSheetUrls(List<String> urls) {
            this.cssUrls.addAll(urls);
        }
        
        public void addRequire(String name, IncludeCommand includeCommand) {
            this.requires.add(name);
            this.includeCommands.add(includeCommand);
        }
        
        public List<String> getJsUrls() {
            return jsUrls;
        }

        public List<String> getCssUrls() {
            return cssUrls;
        }

        public List<String> getRequires() {
            return requires;
        }

        
        public List<IncludeCommand> getIncludeCommands() {
            return includeCommands;
        }
        public String toJSON() {
            if (this.json == null) {
                this.json = AsyncPackageJSONBuilder.getInstance().buildJSON(this);
            }
            return this.json;
        }
    }
    
    public static class Builder implements IncludeAsyncPackageCommandBuilder {
        
        @Override
        public IncludeAsyncPackageCommand build(
                String requireName,
                final String packagePath,
                final ResourceIncluderContext context) {
            
            
            PackageManifest manifest = context.getPackageManager().getCachedPackageManifest(packagePath);
            return new IncludeAsyncPackageCommand(requireName, packagePath, manifest);
        }
    }
}