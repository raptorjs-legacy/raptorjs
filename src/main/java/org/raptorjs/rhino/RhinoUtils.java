package org.raptorjs.rhino;

import org.mozilla.javascript.Wrapper;

public class RhinoUtils {

	public static Object jsToJava(Object obj) {
        while (obj instanceof Wrapper) {
            obj = ((Wrapper) obj).unwrap();
        }
        return obj;
    }
}
