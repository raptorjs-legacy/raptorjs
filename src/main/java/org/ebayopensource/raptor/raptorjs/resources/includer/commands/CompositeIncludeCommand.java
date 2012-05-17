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