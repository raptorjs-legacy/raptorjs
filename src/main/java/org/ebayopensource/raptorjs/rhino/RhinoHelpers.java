package org.ebayopensource.raptorjs.rhino;


public class RhinoHelpers {
    private RaptorJSEnv raptorJSEnv = null;
    
    private BootstrapHelper bootstrap = null;
    private FilesHelper files = null;
    private JavaHelper java = null;
    private RuntimeHelper runtime = null;
    private ConsoleHelper console = null;
    private StacktraceHelper stacktrace = null;
    private ResourcesHelper resources = null;
    
    public RhinoHelpers(RaptorJSEnv raptorJSEnv) {
        this.raptorJSEnv = raptorJSEnv;
        
        this.bootstrap = this.createBootstrap();
        this.files = this.createFiles();
        this.java = this.createJava();
        this.runtime = this.createRuntime();
        this.console = this.createConsole();
        this.stacktrace = this.createStacktrace();
        this.resources = this.createResources();
    }
    
    protected BootstrapHelper createBootstrap() {
        return new BootstrapHelper(raptorJSEnv);
    }
    
    protected FilesHelper createFiles() {
        return new FilesHelper(raptorJSEnv);
    }
    
    protected JavaHelper createJava() {
        return new JavaHelper(raptorJSEnv);
    }
    
    protected RuntimeHelper createRuntime() {
        return new RuntimeHelper(raptorJSEnv);
    }
    
    protected ConsoleHelper createConsole() {
        return new ConsoleHelper(raptorJSEnv);
    }
    
    protected StacktraceHelper createStacktrace() {
        return new StacktraceHelper(raptorJSEnv);
    }
    
    protected ResourcesHelper createResources() {
        return new ResourcesHelper(raptorJSEnv);
    }

    public FilesHelper getFiles() {
        return files;
    }

    public JavaHelper getJava() {
        return java;
    }

    public RuntimeHelper getRuntime() {
        return runtime;
    }

    public BootstrapHelper getBootstrap() {
        return bootstrap;
    }

    public ConsoleHelper getConsole() {
        return console;
    }

    public StacktraceHelper getStacktrace() {
        return stacktrace;
    }

    public ResourcesHelper getResources() {
        return resources;
    }
    
    
    
    
}
