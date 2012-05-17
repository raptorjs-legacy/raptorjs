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

import org.ebayopensource.raptor.raptorjs.resources.includer.ResourceIncludeOptions;
import org.ebayopensource.raptor.raptorjs.resources.includer.ResourceIncluderContext;

public class MissingResourceIncludeCommand implements IncludeCommand {
    private String resourcePath = null;
    private RuntimeException exception = null;
    
    public MissingResourceIncludeCommand(String resourcePath, RuntimeException exception) {
        this.resourcePath = resourcePath;
        this.exception = exception;
    }
    @Override
    public void execute(ResourceIncluderContext context, ResourceIncludeOptions includeOptions) {
        throw exception;
    }
    @Override
    public String toString() {
        return "MissingResourceIncludeCommand [resourcePath=" + resourcePath + "]";
    }
    
    
    
}