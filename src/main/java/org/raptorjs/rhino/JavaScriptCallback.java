package org.raptorjs.rhino;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

public class JavaScriptCallback {

	private Function callback = null;
	private Scriptable thisObj = null;
	
	public JavaScriptCallback(Function callback, Scriptable thisObj) {
		this.callback = callback;
		this.thisObj = thisObj;
	}

	public void invoke(Object ...eventArgs) {
		Context context = Context.enter();
		try
		{
			this.callback.call(context, this.callback.getParentScope(), this.thisObj, eventArgs);	
		}
		finally {
			if (context != null) {
                Context.exit();
            }
		}
		
	}
	
	
}
