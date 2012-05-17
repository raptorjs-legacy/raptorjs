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

package org.ebayopensource.raptor.raptorjs.rhino;

import org.ebayopensource.raptor.raptorjs.resources.Resource;
import org.ebayopensource.raptor.raptorjs.resources.ResourceManager;

public class ResourcesHelper {
    private ResourceManager resourceManager = null;
    
    public ResourcesHelper(RaptorJSEnv jsEnv) {
        this.resourceManager = jsEnv.getResourceManager();
    }
    
    public Resource findResource(String path) {
        Resource resource = this.resourceManager.findResource(path);
        return resource;
    }
}
