package org.raptorjs.rhino;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.raptorjs.resources.WatchListener;

public class JavaScriptCallbackWatchListener implements WatchListener {

	private Context context = null;
	private Function callback = null;
	private Scriptable thisObj = null;
	
	public JavaScriptCallbackWatchListener(Context context, Function callback, Scriptable thisObj) {
		this.context = context;
		this.callback = callback;
		this.thisObj = thisObj;
	}

	public void notifyModified(Object eventArgs) {
		Context context = Context.enter();
		try
		{
			this.callback.call(this.context, this.callback.getParentScope(), this.thisObj, new Object[] { eventArgs });	
		}
		finally {
			if (context != null) {
                Context.exit();
            }
		}
		
	}
	
	
}
