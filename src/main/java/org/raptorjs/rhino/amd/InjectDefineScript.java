package org.raptorjs.rhino.amd;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.raptorjs.rhino.RaptorJSEnv;

public class InjectDefineScript implements Script {

	private RaptorJSEnv raptorJSEnv = null;
	private ScriptableObject raptor = null;
	
	public InjectDefineScript(RaptorJSEnv raptorJSEnv) {
		super();
		this.raptorJSEnv = raptorJSEnv;
	}

	@Override
	public Object exec(Context cx, Scriptable scope) {
		if (raptor != null && raptor.has("createDefine", scope)) {
			Object module = scope.get("module", scope);
			Object defineFunc = raptorJSEnv.getJavaScriptEngine().invokeMethod(raptor, "createDefine", module);
			scope.put("define", scope, defineFunc);
		}
		return null;
	}

	public ScriptableObject getRaptor() {
		return raptor;
	}

	public void setRaptor(ScriptableObject raptor) {
		this.raptor = raptor;
	}

	

	
}
