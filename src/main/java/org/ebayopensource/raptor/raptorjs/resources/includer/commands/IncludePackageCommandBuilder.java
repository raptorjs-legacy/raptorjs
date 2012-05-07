package org.ebayopensource.raptor.raptorjs.resources.includer.commands;

import org.ebayopensource.raptor.raptorjs.resources.includer.ResourceIncluderContext;

public interface IncludePackageCommandBuilder {
    IncludeCommand build(String packagePath, ResourceIncluderContext context);
}
