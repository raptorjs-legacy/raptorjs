package org.ebayopensource.raptor.raptorjs.resources.includer.commands;

import org.ebayopensource.raptor.raptorjs.resources.includer.ResourceIncludeOptions;
import org.ebayopensource.raptor.raptorjs.resources.includer.ResourceIncluderContext;

public interface IncludeCommand {
    void execute(ResourceIncluderContext context, ResourceIncludeOptions includeOptions);
}