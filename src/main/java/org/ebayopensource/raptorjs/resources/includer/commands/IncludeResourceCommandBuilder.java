package org.ebayopensource.raptorjs.resources.includer.commands;

import org.ebayopensource.raptorjs.resources.Resource;
import org.ebayopensource.raptorjs.resources.includer.ResourceIncluderContext;
import org.ebayopensource.raptorjs.resources.includer.ResourceIncluder.ResourceType;


public interface IncludeResourceCommandBuilder {
    IncludeCommand build(Resource resource, ResourceType resourceType, ResourceIncluderContext context);
}
