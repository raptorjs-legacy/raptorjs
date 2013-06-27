package org.raptorjs.resources.packaging;

import java.util.List;


public abstract class DependencyPackage extends Dependency {

    private PackageManifest packageManifest = null;
    
    public abstract PackageManifest resolvePackageManifest(ResourceIncluderContext context);
    public abstract String getAsyncRequireName();

    @Override
    public boolean isPackageInclude() {
        return true;
    }

    @Override
    protected void doInclude(IncludeOptions includeOptions, ResourceIncluderContext context) {
        PackageManifest manifest = this.getPackageManifest(context);
        List<Dependency> includes = manifest.getDependencies();
        
        if (!context.isPackageExtensionIncluded(manifest, null)) {
            context.setPackageExtensionIncluded(manifest, null);
            for (Dependency include : includes) {
                include.include(includeOptions, context);
            }    
        }
        
        List<Extension> extensions = manifest.getExtensions();
        for (Extension extension : extensions) {
            if (!context.isPackageExtensionIncluded(manifest, extension) && context.isExtensionEnabled(extension, includeOptions)) {
                context.setPackageExtensionIncluded(manifest, extension);
                
                for (Dependency include : extension.getDependencies()) {
                    include.include(includeOptions, context);
                }    
            }
        }
    }
    
    @Override
    protected void doIncludeAsync(IncludeOptions includeOptions, ResourceIncluderContext context) {
        
        context.includeAsyncPackage(this.getAsyncRequireName(), this.getPackageManifest(context), includeOptions);
    }
    
    public PackageManifest getPackageManifest(ResourceIncluderContext context) {
        if (this.packageManifest == null) {
            this.packageManifest = this.resolvePackageManifest(context);
        }
        return this.packageManifest;
    }
    
    
}
