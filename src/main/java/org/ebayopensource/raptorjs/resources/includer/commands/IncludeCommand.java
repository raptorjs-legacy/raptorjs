package org.ebayopensource.raptorjs.resources.includer.commands;

import org.ebayopensource.raptorjs.resources.includer.ResourceIncludeOptions;
import org.ebayopensource.raptorjs.resources.includer.ResourceIncluderContext;

public interface IncludeCommand {
    void execute(ResourceIncluderContext context, ResourceIncludeOptions includeOptions);
}