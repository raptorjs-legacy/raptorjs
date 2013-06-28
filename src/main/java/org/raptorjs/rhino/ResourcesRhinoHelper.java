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

package org.raptorjs.rhino;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.raptorjs.resources.Resource;
import org.raptorjs.resources.ResourceManager;
import org.raptorjs.resources.ResourcesListener;
import org.raptorjs.resources.ResourceManager.ResourceCallback;
import org.raptorjs.resources.WatchListener;

public class ResourcesRhinoHelper {
    private ResourceManager resourceManager = null;

    public ResourcesRhinoHelper(RaptorJSEnv jsEnv) {
        this.resourceManager = jsEnv.getResourceManager();
    }
    
    public Resource findResource(String path) {
        Resource resource = this.resourceManager.findResource(path);
        return resource;
    }
    
    public void onResourcesModified(Function callback, Scriptable thisObj) {
        final WatchListener listener = this.createWatchListener(callback, thisObj);
        this.resourceManager.addListener(new ResourcesListener() {
            
            @Override
            public void onResourcesModified() {
                listener.notifyModified(null);
            }
        });
    }
    
    public void forEachResource(String path, Function callback, Scriptable thisObj) {
        this.resourceManager.forEachResource(path, new JavaScriptResourceCallback(callback, thisObj));
    }
    
    public WatchListener createWatchListener(Function callback, Scriptable thisObj) {
    	JavaScriptCallbackWatchListener listener = new JavaScriptCallbackWatchListener(Context.getCurrentContext(), callback, thisObj);
    	return listener;
    }
    
    private static class JavaScriptResourceCallback extends JavaScriptCallback implements ResourceCallback {

		public JavaScriptResourceCallback(Function callback, Scriptable thisObj) {
			super(callback, thisObj);
		}

		public void resourceFound(Resource resource) {
			this.invoke(resource);
		}
    	
    }
}
