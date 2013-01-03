package org.raptorjs.rhino;

import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.commonjs.module.provider.ModuleSourceProvider;
import org.raptorjs.rhino.commonjs.module.Require;

public class RaptorRequire extends Require {
	private final static Pattern urlRegExp = Pattern.compile("^\\w+:/");
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private RaptorJSEnv raptorJSEnv = null;
	
	public RaptorRequire(Context cx, Scriptable nativeScope,
			ModuleSourceProvider moduleSourceProvider, Script preExec,
			Script postExec, boolean sandboxed, RaptorJSEnv raptorJSEnv) {
		super(cx, nativeScope, moduleSourceProvider, preExec, postExec, sandboxed);
		this.raptorJSEnv = raptorJSEnv;
	}
	
	@Override
	protected Scriptable require(Context cx, String id, URI uri, URI base,boolean isMain) throws Exception {
		
		Matcher urlMatcher = urlRegExp.matcher(id);
		if (!urlMatcher.lookingAt()) {
			Scriptable module = raptorJSEnv.find(id);
			if (module != null) {
				return module;
			}	
		}
		
		return super.require(cx, id, uri, base, isMain);
	}

}
