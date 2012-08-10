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

public class ConsoleHelper {
    private RaptorJSEnv raptorJS = null;

    public ConsoleHelper(RaptorJSEnv raptorJS) {
        super();
        this.raptorJS = raptorJS;
    }
    
    public void log(Object o) {
        System.out.println(o);
    }
    
    public void error(Object o) {
        System.err.println(o);
    }

    public RaptorJSEnv getRaptorJS() {
        return raptorJS;
    }
    
    
}
