package org.ebayopensource.raptor.raptorjs.resources.includer.commands;

import org.ebayopensource.raptor.raptorjs.resources.Resource;
import org.ebayopensource.raptor.raptorjs.resources.includer.ResourceIncluderContext;
import org.ebayopensource.raptor.raptorjs.resources.includer.ResourceIncluder.ResourceType;


public interface IncludeResourceCommandBuilder {
    IncludeCommand build(Resource resource, ResourceType resourceType, ResourceIncluderContext context);
}
