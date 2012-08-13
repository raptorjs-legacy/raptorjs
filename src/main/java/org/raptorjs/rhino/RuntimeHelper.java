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

import java.io.File;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class RuntimeHelper {
    private RaptorJSEnv raptorJS;
    private Map<String, Boolean> evaluatedFiles = new ConcurrentHashMap<String, Boolean>();
    
    public RuntimeHelper(RaptorJSEnv raptorJS) {
        this.raptorJS = raptorJS;
    }
    
    public void require(String path) {
        if (!this.isRequired(path)) {
            this.evaluateFile(path);
            this.setRequired(path);
        }
    }
    
    public void evaluateFile(String path) {
        File file = new File(path);
        String source = this.raptorJS.getRhinoHelpers().getFiles().readFully(file, "UTF-8");
        this.raptorJS.getJavaScriptEngine().eval(source, path);
    }
    
    public void evaluateString(String source, String path) {
        this.raptorJS.getJavaScriptEngine().eval(source, path);
    }
    
    public boolean isRequired(String path) {
        return this.evaluatedFiles.containsKey(path);
    }
    
    public void setRequired(String path) {
        this.evaluatedFiles.put(path, Boolean.TRUE);
    }
}
