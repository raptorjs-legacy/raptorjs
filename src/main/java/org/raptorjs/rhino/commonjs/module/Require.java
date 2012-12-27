package org.raptorjs.rhino.commonjs.module;

import java.io.Reader;
import java.net.URI;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.TopLevel;
import org.mozilla.javascript.commonjs.module.ModuleScope;
import org.mozilla.javascript.commonjs.module.ModuleScript;
import org.mozilla.javascript.commonjs.module.RequireBuilder;
import org.mozilla.javascript.commonjs.module.provider.ModuleSource;
import org.mozilla.javascript.commonjs.module.provider.ModuleSourceProvider;

/**
 * Implements the require() function as defined by
 * <a href="http://wiki.commonjs.org/wiki/Modules/1.1">Common JS modules</a>.
 * <h1>Thread safety</h1>
 * You will ordinarily create one instance of require() for every top-level
 * scope. This ordinarily means one instance per program execution, except if
 * you use shared top-level scopes and installing most objects into them.
 * Module loading is thread safe, so using a single require() in a shared
 * top-level scope is also safe.
 * <h1>Creation</h1>
 * If you need to create many otherwise identical require() functions for
 * different scopes, you might want to use {@link RequireBuilder} for
 * convenience.
 * <h1>Making it available</h1>
 * In order to make the require() function available to your JavaScript
 * program, you need to invoke either {@link #install(Scriptable)} or
 * {@link #requireMain(Context, String)}.
 * @author Attila Szegedi, Patrick Steele-Idem
 * @version $Id: Require.java,v 1.4 2011/04/07 20:26:11 hannes%helma.at Exp $
 */
public class Require extends BaseFunction
{
    private static final long serialVersionUID = 1L;

    private static final Scriptable missingModule = new TopLevel();
    
    private final ModuleSourceProvider moduleSourceProvider;
    private final Scriptable nativeScope;
    private final Scriptable paths;
    private final boolean sandboxed;
    private final Script preExec;
    private final Script postExec;
    private String mainModuleId = null;
    private Scriptable mainExports = null;

    // Modules that completed loading; visible to all threads
    private final Map<URI, Scriptable> moduleCache = new ConcurrentHashMap<URI, Scriptable>();
    private Map<Object, Scriptable> unresolvedModuleCache = new ConcurrentHashMap<Object, Scriptable>();
    
    
    private final Object loadLock = new Object();
    
    // Modules currently being loaded on the thread. Used to resolve circular
    // dependencies while loading.
    private static final ThreadLocal<Map<URI, Scriptable>>
        loadingModuleInterfaces = new ThreadLocal<Map<URI,Scriptable>>();

    /**
     * Creates a new instance of the require() function. Upon constructing it,
     * you will either want to install it in the global (or some other) scope
     * using {@link #install(Scriptable)}, or alternatively, you can load the
     * program's main module using {@link #requireMain(Context, String)} and
     * then act on the main module's exports.
     * @param cx the current context
     * @param nativeScope a scope that provides the standard native JavaScript
     * objects.
     * @param moduleScriptProvider a provider for module scripts
     * @param preExec an optional script that is executed in every module's
     * scope before its module script is run.
     * @param postExec an optional script that is executed in every module's
     * scope after its module script is run.
     * @param sandboxed if set to true, the require function will be sandboxed.
     * This means that it doesn't have the "paths" property, and also that the
     * modules it loads don't export the "module.uri" property.
     */
    public Require(Context cx, Scriptable nativeScope,
    		ModuleSourceProvider moduleSourceProvider, Script preExec,
            Script postExec, boolean sandboxed) {
        this.moduleSourceProvider = moduleSourceProvider;
        this.nativeScope = nativeScope;
        this.sandboxed = sandboxed;
        this.preExec = preExec;
        this.postExec = postExec;
        setPrototype(ScriptableObject.getFunctionPrototype(nativeScope));
        if(!sandboxed) {
            paths = cx.newArray(nativeScope, 0);
            defineReadOnlyProperty(this, "paths", paths);
        }
        else {
            paths = null;
        }
    }

    /**
     * Calling this method establishes a module as being the main module of the
     * program to which this require() instance belongs. The module will be
     * loaded as if require()'d and its "module" property will be set as the
     * "main" property of this require() instance. You have to call this method
     * before the module has been loaded (that is, the call to this method must
     * be the first to require the module and thus trigger its loading). Note
     * that the main module will execute in its own scope and not in the global
     * scope. Since all other modules see the global scope, executing the main
     * module in the global scope would open it for tampering by other modules.
     * @param cx the current context
     * @param mainModuleId the ID of the main module
     * @return the "exports" property of the main module
     * @throws IllegalStateException if the main module is already loaded when
     * required, or if this require() instance already has a different main
     * module set.
     */
    public Scriptable requireMain(Context cx, String mainModuleId) {
        if(this.mainModuleId != null) {
            if (!this.mainModuleId.equals(mainModuleId)) {
                throw new IllegalStateException("Main module already set to " +
                    this.mainModuleId);
            }
            return mainExports;
        }

        try {
			mainExports = require(cx, mainModuleId,
			        null, null, true);
		} catch (Exception e) {
			throw new RuntimeException("requireMain() failed for module \"" + mainModuleId + "\". Exception: " + e, e);
		}

        this.mainModuleId = mainModuleId;
        return mainExports;
    }

    /**
     * Binds this instance of require() into the specified scope under the
     * property name "require".
     * @param scope the scope where the require() function is to be installed.
     */
    public void install(Scriptable scope) {
        ScriptableObject.putProperty(scope, "require", this);
    }

    @Override
    public Object call(Context cx, Scriptable scope, Scriptable thisObj,
            Object[] args)
    {
        if(args == null || args.length < 1) {
            throw ScriptRuntime.throwError(cx, scope,
                    "require() needs one argument");
        }

        String id = (String)Context.jsToJava(args[0], String.class);
        URI uri = null;
        URI base = null;
        if (id.startsWith("./") || id.startsWith("../")) {
            if (!(thisObj instanceof ModuleScope)) {
                throw ScriptRuntime.throwError(cx, scope,
                        "Can't resolve relative module ID \"" + id +
                                "\" when require() is used outside of a module");
            }

            ModuleScope moduleScope = (ModuleScope) thisObj;
            base = moduleScope.getBase();
            URI current = moduleScope.getUri();
            uri = current.resolve(id);

            if (base == null) {
                // calling module is absolute, resolve to absolute URI
                // (but without file extension)
                id = uri.toString();
            } else {
                // try to convert to a relative URI rooted on base
                id = base.relativize(current).resolve(id).toString();
                if (id.charAt(0) == '.') {
                    // resulting URI is not contained in base,
                    // throw error or make absolute depending on sandbox flag.
                    if (sandboxed) {
                        throw ScriptRuntime.throwError(cx, scope,
                            "Module \"" + id + "\" is not contained in sandbox.");
                    } else {
                        id = uri.toString();
                    }
                }
            }
        }
        try {
			Scriptable module = require(cx, id, uri, base, false);
			if (module == null) {
				throw ScriptRuntime.throwError(cx, nativeScope, "Module \"" + (uri != null ? uri.toString() : id) + "\" not found.");
			}
			return module;
		} catch (Exception e) {
			String stackTrace = null;
			if (e instanceof RhinoException) {
				RhinoException re = (RhinoException) e;
				stackTrace = re.getScriptStackTrace();
			}
			String failedModuleId = uri != null ? uri.toString() : id;
			throw ScriptRuntime.throwError(cx, scope,
	                "require() failed for module \"" + failedModuleId + "\". Exception: " + e + (stackTrace != null ? "\nStack trace: " + stackTrace : ""));
		}
    }

    public Scriptable construct(Context cx, Scriptable scope, Object[] args) {
        throw ScriptRuntime.throwError(cx, scope,
                "require() can not be invoked as a constructor");
    }

    protected Scriptable require(Context cx, String id, URI uri, URI base, boolean isMain) throws Exception
    {
    	
    	Object cacheKey = null;
		
		if (uri != null) {
			/*
			 * The moduleUri should only be set for relative module IDs.
			 * For relative module IDs we can use the moduleUri as the 
			 * cache key since the "paths" object is not used to load
			 * the module
			 */
			cacheKey = uri;
		}
		else {
			cacheKey = new TopLevelModuleCacheKey(convertPathsArray(this.paths), id);
		}
		
		Scriptable exports = this.unresolvedModuleCache.get(cacheKey);
		if (exports == missingModule) {
			return null;
			
		}
		
		if (exports == null) {
			synchronized(Require.class) {
				exports = this.unresolvedModuleCache.get(cacheKey);
				if (exports == null) {
					ModuleSource moduleSource = this.loadModuleSource(cx, id, uri, base);
					if (moduleSource == null) {
						this.unresolvedModuleCache.put(cacheKey, missingModule);
					}
					else {
						exports = this.moduleCache.get(moduleSource.getUri());
						
						if (exports == null) {
							exports = this.loadModuleExports(cx, moduleSource, isMain);
						}
						
						this.unresolvedModuleCache.put(cacheKey, exports);
					}					
				}
			}
		}
        return exports;
        
    }
    
    private ModuleSource loadModuleSource(Context cx, String moduleId, URI moduleUri, URI baseUri) throws Exception
    {
		final ModuleSource moduleSource = (moduleUri == null)
                ? moduleSourceProvider.loadSource(moduleId, paths, null)
                : moduleSourceProvider.loadSource(moduleUri, baseUri, null);
                
        return moduleSource;
    }
    
    private ModuleScript loadModuleScript(Context cx, ModuleSource moduleSource) throws Exception {
    	final Reader reader = moduleSource.getReader();
        try {
        	
        	ModuleScript moduleScript = new ModuleScript(
                cx.compileReader(reader, moduleSource.getUri().toString(), 1,
                        moduleSource.getSecurityDomain()),
                        moduleSource.getUri(), moduleSource.getBase());
            
            
            return moduleScript;
        }
        finally {
            reader.close();
        }
    }
    
    private Scriptable loadModuleExports(Context cx, ModuleSource moduleSource, boolean isMain) throws Exception {
    	
    	URI uri = moduleSource.getUri();
    	
        // Check if the requested module is already completely loaded
        Scriptable exports = moduleCache.get(uri);
        if(exports != null) {
            if(isMain) {
                throw new IllegalStateException(
                        "Attempt to set main module after it was loaded");
            }
            return exports;
        }
        
        // Check if it is currently being loaded on the current thread
        // (supporting circular dependencies).
        Map<URI, Scriptable> threadLoadingModules = loadingModuleInterfaces.get();
        
        if(threadLoadingModules != null) {
            exports = threadLoadingModules.get(uri);
            if(exports != null) {
                return exports;
            }
        }
        // The requested module is neither already loaded, nor is it being
        // loaded on the current thread. End of fast path. We must synchronize
        // now, as we have to guarantee that at most one thread can load
        // modules at any one time. Otherwise, two threads could end up
        // attempting to load two circularly dependent modules in opposite
        // order, which would lead to either unacceptable non-determinism or
        // deadlock, depending on whether we underprotected or overprotected it
        // with locks.
        synchronized(loadLock) {
            // Recheck if it is already loaded - other thread might've
            // completed loading it just as we entered the synchronized block.
            exports = moduleCache.get(uri);
            if(exports != null) {
                return exports;
            }
            // Nope, still not loaded; we're loading it then.
            final ModuleScript moduleScript = this.loadModuleScript(cx, moduleSource);
            
            if (sandboxed && !moduleScript.isSandboxed()) {
                throw ScriptRuntime.throwError(cx, nativeScope, "Module \""
                        + uri + "\" is not contained in sandbox.");
            }
            exports = cx.newObject(nativeScope);
            // Are we the outermost locked invocation on this thread?
            final boolean outermostLocked = threadLoadingModules == null;
            if(outermostLocked) {
                threadLoadingModules = new HashMap<URI, Scriptable>();
                loadingModuleInterfaces.set(threadLoadingModules);
            }
            // Must make the module exports available immediately on the
            // current thread, to satisfy the CommonJS Modules/1.1 requirement
            // that "If there is a dependency cycle, the foreign module may not
            // have finished executing at the time it is required by one of its
            // transitive dependencies; in this case, the object returned by
            // "require" must contain at least the exports that the foreign
            // module has prepared before the call to require that led to the
            // current module's execution."
            threadLoadingModules.put(uri, exports);
            try {
                // Support non-standard Node.js feature to allow modules to
                // replace the exports object by setting module.exports.
                Scriptable newExports = executeModuleScript(cx, uri, exports,
                        moduleScript, isMain);
                if (exports != newExports) {
                    threadLoadingModules.put(uri, newExports);
                    exports = newExports;
                }
            }
            catch(RuntimeException e) {
                // Throw loaded module away if there was an exception
                threadLoadingModules.remove(uri);
                throw e;
            }
            finally {
                if(outermostLocked) {
                    // Make loaded modules visible to other threads only after
                    // the topmost triggering load has completed. This strategy
                    // (compared to the one where we'd make each module
                    // globally available as soon as it loads) prevents other
                    // threads from observing a partially loaded circular
                    // dependency of a module that completed loading.
                    moduleCache.putAll(threadLoadingModules);
                    loadingModuleInterfaces.set(null);
                }
            }
        }
        return exports;
    }

    private Scriptable executeModuleScript(Context cx, URI uri,
            Scriptable exports, ModuleScript moduleScript, boolean isMain)
    {
        final ScriptableObject moduleObject = (ScriptableObject)cx.newObject(
                nativeScope);

        URI base = moduleScript.getBase();
        defineReadOnlyProperty(moduleObject, "id", uri.toString());
        defineReadOnlyProperty(moduleObject, "require", this);
        
        if(!sandboxed) {
            defineReadOnlyProperty(moduleObject, "uri", uri.toString());
        }
        final Scriptable executionScope = new ModuleScope(nativeScope, uri, base);
        // Set this so it can access the global JS environment objects.
        // This means we're currently using the "MGN" approach (ModuleScript
        // with Global Natives) as specified here:
        // <http://wiki.commonjs.org/wiki/Modules/ProposalForNativeExtension>
        executionScope.put("exports", executionScope, exports);
        executionScope.put("module", executionScope, moduleObject);
        moduleObject.put("exports", moduleObject, exports);
        install(executionScope);
        if(isMain) {
            defineReadOnlyProperty(this, "main", moduleObject);
        }
        executeOptionalScript(preExec, cx, executionScope);
        moduleScript.getScript().exec(cx, executionScope);
        executeOptionalScript(postExec, cx, executionScope);
        return ScriptRuntime.toObject(nativeScope,
                ScriptableObject.getProperty(moduleObject, "exports"));
    }

    private static void executeOptionalScript(Script script, Context cx,
            Scriptable executionScope)
    {
        if(script != null) {
            script.exec(cx, executionScope);
        }
    }

    private static void defineReadOnlyProperty(ScriptableObject obj,
            String name, Object value) {
        ScriptableObject.putProperty(obj, name, value);
        obj.setAttributes(name, ScriptableObject.READONLY |
                ScriptableObject.PERMANENT);
    }

    @Override
    public String getFunctionName() {
        return "require";
    }

    @Override
    public int getArity() {
        return 1;
    }

    @Override
    public int getLength() {
        return 1;
    }
    
    private String[] convertPathsArray(Scriptable paths) {
		if (paths == null) {
			return null;
		}
		
		final long lengthLong = ScriptRuntime.toUint32(
                ScriptableObject.getProperty(paths, "length"));
        // Yeah, I'll ignore entries beyond Integer.MAX_VALUE; so sue me.
        final int length = lengthLong > Integer.MAX_VALUE ? Integer.MAX_VALUE :
            (int)lengthLong;
        
        String[] pathsArray = new String[length];

        for(int i = 0; i < length; ++i) {
            String path = ScriptableObject.getTypedProperty(paths, i, String.class);
            pathsArray[i] = path;
        }
        return pathsArray;
	}
	
	
	private static class TopLevelModuleCacheKey {
		private String[] paths = null;
		private String moduleId = null;
		
		public TopLevelModuleCacheKey(String[] paths, String moduleId) {
			super();
			this.paths = paths;
			this.moduleId = moduleId;
		}

		@Override
		public int hashCode() {
			final int prime = 31;
			int result = 1;
			result = prime * result
					+ ((moduleId == null) ? 0 : moduleId.hashCode());
			result = prime * result + Arrays.hashCode(paths);
			return result;
		}

		@Override
		public boolean equals(Object obj) {
			if (this == obj)
				return true;
			if (obj == null)
				return false;
			if (getClass() != obj.getClass())
				return false;
			TopLevelModuleCacheKey other = (TopLevelModuleCacheKey) obj;
			if (moduleId == null) {
				if (other.moduleId != null)
					return false;
			} else if (!moduleId.equals(other.moduleId))
				return false;
			if (!Arrays.equals(paths, other.paths))
				return false;
			return true;
		}
		
		
	}
}