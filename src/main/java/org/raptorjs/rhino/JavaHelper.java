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

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.util.Collection;
import java.util.Map;

public class JavaHelper {
    
    public JavaHelper(RaptorJSEnv raptorJS) {
        
    }
    public boolean isString(Object o) {
        return o instanceof String;
    }
    
    public boolean isNumber(Object o) {
        return this.isInteger(o) ||
            this.isFloat(o) ||
            this.isDouble(o);
        
    }
    
    public boolean isInteger(Object o) {
        return o instanceof Integer;
    }
    
    public boolean isLong(Object o) {
        return o instanceof Long;
    }
    
    public boolean isFloat(Object o) {
        return o instanceof Float;
    }
    
    public boolean isDouble(Object o) {
        return o instanceof Double;
    }
    
    public boolean isBoolean(Object o) {
        return o instanceof Boolean;
    }
    
    public boolean isArray(Object o) {
        return o.getClass().isArray();
    }
    
    public boolean isCollection(Object o) {
        return o instanceof Collection;
    }
    
    public boolean isMap(Object o) {
        return o instanceof Map;
    }
    
    public InputStream getStringInputStream(String str) throws UnsupportedEncodingException {
        byte[] bytes = str.getBytes("UTF-8");
        return new ByteArrayInputStream(bytes);
    }
}
