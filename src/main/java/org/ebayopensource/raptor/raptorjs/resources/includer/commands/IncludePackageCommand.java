package org.ebayopensource.raptor.raptorjs.resources.includer.commands;

import java.util.ArrayList;
import java.util.List;

import org.ebayopensource.raptor.raptorjs.resources.includer.PackageIncludeOptions;
import org.ebayopensource.raptor.raptorjs.resources.includer.ResourceIncludeOptions;
import org.ebayopensource.raptor.raptorjs.resources.includer.ResourceIncluderContext;
import org.ebayopensource.raptor.raptorjs.resources.packaging.PackageManifest;
import org.ebayopensource.raptor.raptorjs.resources.packaging.PackageManifest.Extension;
import org.ebayopensource.raptor.raptorjs.resources.packaging.PackageManifest.ExtensionCallback;
import org.ebayopensource.raptor.raptorjs.resources.packaging.PackageManifest.Include;
import org.ebayopensource.raptor.raptorjs.resources.packaging.PackageManifest.IncludeCallback;


public class IncludePackageCommand implements IncludeCommand {
    private String packagePath = null;
    
    private List<ExtensionIncludeCommands> extensionIncludeCommands = null;

    protected IncludePackageCommand(String packagePath, List<ExtensionIncludeCommands> extensionIncludeCommands) {
        super();
        this.packagePath = packagePath;
        this.extensionIncludeCommands = extensionIncludeCommands;
    }

    
    @Override
    public String toString() {
        return "IncludePackageCommand [packagePath=" + packagePath
                + ", extensionIncludeCommands=" + extensionIncludeCommands
                + "]";
    }


    @Override
    public void execute(ResourceIncluderContext context, ResourceIncludeOptions includeOptions) {
        PackageIncludeOptions packageIncludeOptions = null;
        if (includeOptions instanceof PackageIncludeOptions) {
            packageIncludeOptions = (PackageIncludeOptions) includeOptions;
        }
         
        for(ExtensionIncludeCommands extensionIncludeCommands : this.extensionIncludeCommands) {
            if (context.isPackageExtensionIncluded(packagePath, extensionIncludeCommands.extension)) {
                continue; //Nothing to do, already included
            }
            
            if (context.isExtensionEnabled(extensionIncludeCommands.extension, packageIncludeOptions)) {
                extensionIncludeCommands.execute(context, packageIncludeOptions);
            }
            
            context.setPackageExtensionIncluded(packagePath, extensionIncludeCommands.extension);
        }
    }
    
    private static class ExtensionIncludeCommands {
        List<IncludeCommand> includeCommands = new ArrayList<IncludeCommand>();
        private Extension extension = null;
        
        private ExtensionIncludeCommands(Extension extension) {
            this.extension = extension;
        }
        
        @Override
        public String toString() {
            return "ExtensionResourceIncludes [includeCommands="
                    + includeCommands + "]";
        }
        
        public void execute(ResourceIncluderContext context, ResourceIncludeOptions includeOptions) {
            for(IncludeCommand command : this.includeCommands) {
                command.execute(context, includeOptions);
            }
        }
    }
    
    public static class Builder implements IncludePackageCommandBuilder {

        @Override
        public IncludeCommand build(
                String packagePath,
                final ResourceIncluderContext context) {
            
            final PackageManifest manifest = context.getPackageManager().getCachedPackageManifest(packagePath);

            final List<ExtensionIncludeCommands> extensionIncludeCommandsList = new ArrayList<ExtensionIncludeCommands>(); 
                    
            manifest.forEachExtension(new ExtensionCallback() {

                @Override
                public void handleExtension(Extension extension) {
                    final ExtensionIncludeCommands extensionIncludeCommands = new ExtensionIncludeCommands(extension);
                    extensionIncludeCommandsList.add(extensionIncludeCommands);
                    
                    extension.forEachInclude(new IncludeCallback() {

                        @Override
                        public void handleInclude(Include include,
                                Extension extension) {
                            IncludeCommand includeCommand = context.getResourceIncluder().buildIncludeCommand(include, manifest, context);
                            extensionIncludeCommands.includeCommands.add(includeCommand);
                        }
                        
                    });
                }
                
            });

            return new IncludePackageCommand(packagePath, extensionIncludeCommandsList);
        }
    }
    
    
}