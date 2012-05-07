package org.ebayopensource.raptor.raptorjs.resources.includer.commands;

import java.util.ArrayList;
import java.util.List;

import org.ebayopensource.raptor.raptorjs.resources.includer.ResourceIncludeOptions;
import org.ebayopensource.raptor.raptorjs.resources.includer.ResourceIncluderContext;


public class CompositeIncludeCommand implements IncludeCommand {
    private List<IncludeCommand> includes = new ArrayList<IncludeCommand>();

    public CompositeIncludeCommand(List<IncludeCommand> includes) {
        super();
        this.includes = includes;
    }

    @Override
    public void execute(ResourceIncluderContext context, ResourceIncludeOptions includeOptions) {
        for (IncludeCommand include : this.includes) {
            include.execute(context, includeOptions);
        }
    }
}