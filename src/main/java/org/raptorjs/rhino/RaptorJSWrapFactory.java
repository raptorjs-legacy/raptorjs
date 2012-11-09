package org.raptorjs.rhino;

import java.util.List;
import java.util.Map;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.WrapFactory;

public class RaptorJSWrapFactory extends WrapFactory {
	
	
	public RaptorJSWrapFactory() {
		super();
	}



	@Override
	public Object wrap(Context cx, Scriptable scope, Object obj,
			Class<?> staticType) {
		if (obj instanceof Map) {
			return new ScriptableMap(scope, (Map)obj);
		}
		else if (obj instanceof List) {
			return new ScriptableList(scope, (List)obj);
		}
		return super.wrap(cx, scope, obj, staticType);
	}

}
