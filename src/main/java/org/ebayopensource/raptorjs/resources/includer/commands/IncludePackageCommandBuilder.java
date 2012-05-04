package org.ebayopensource.raptorjs.resources.includer.commands;

import org.ebayopensource.raptorjs.resources.includer.ResourceIncluderContext;

public interface IncludePackageCommandBuilder {
    IncludeCommand build(String packagePath, ResourceIncluderContext context);
}
