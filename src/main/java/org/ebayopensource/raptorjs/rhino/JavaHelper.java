package org.ebayopensource.raptorjs.rhino;

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
