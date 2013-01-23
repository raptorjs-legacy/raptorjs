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


public class RhinoHelpers {
    private RaptorJSEnv raptorJSEnv = null;
    
    private BootstrapRhinoHelper bootstrap = null;
    private FilesRhinoHelper files = null;
    private JavaRhinoHelper java = null;
    private RuntimeHelper runtime = null;
    private ConsoleRhinoHelper console = null;
    private StacktraceRhinoHelper stacktrace = null;
    private ResourcesRhinoHelper resources = null;
    private XmlRhinoHelper xml = null;
    private WidgetsRhinoHelper widgets = null;
    
    public RhinoHelpers(RaptorJSEnv raptorJSEnv) {
        this.raptorJSEnv = raptorJSEnv;
        
        this.bootstrap = this.createBootstrap();
        this.files = this.createFiles();
        this.java = this.createJava();
        this.runtime = this.createRuntime();
        this.console = this.createConsole();
        this.stacktrace = this.createStacktrace();
        this.resources = this.createResources();
        this.widgets = this.createWidgetsHelper();
        this.xml = this.createXml();
    }
    
    protected BootstrapRhinoHelper createBootstrap() {
        return new BootstrapRhinoHelper(raptorJSEnv);
    }
    
    protected FilesRhinoHelper createFiles() {
        return new FilesRhinoHelper(raptorJSEnv);
    }
    
    protected JavaRhinoHelper createJava() {
        return new JavaRhinoHelper(raptorJSEnv);
    }
    
    protected RuntimeHelper createRuntime() {
        return new RuntimeHelper(raptorJSEnv);
    }
    
    protected ConsoleRhinoHelper createConsole() {
        return new ConsoleRhinoHelper(raptorJSEnv);
    }
    
    protected StacktraceRhinoHelper createStacktrace() {
        return new StacktraceRhinoHelper(raptorJSEnv);
    }
    
    protected ResourcesRhinoHelper createResources() {
        return new ResourcesRhinoHelper(raptorJSEnv);
    }
    
    protected WidgetsRhinoHelper createWidgetsHelper() {
        return new WidgetsRhinoHelper();
    }
    
    protected XmlRhinoHelper createXml() {
        return new XmlRhinoHelper();
    }

    public FilesRhinoHelper getFiles() {
        return files;
    }

    public JavaRhinoHelper getJava() {
        return java;
    }

    public RuntimeHelper getRuntime() {
        return runtime;
    }

    public BootstrapRhinoHelper getBootstrap() {
        return bootstrap;
    }

    public ConsoleRhinoHelper getConsole() {
        return console;
    }

    public StacktraceRhinoHelper getStacktrace() {
        return stacktrace;
    }

    public ResourcesRhinoHelper getResources() {
        return resources;
    }

	public XmlRhinoHelper getXml() {
		return xml;
	}
	
	

	public WidgetsRhinoHelper getWidgets() {
		return widgets;
	}

	public RaptorJSEnv getRaptorJSEnv() {
		return raptorJSEnv;
	}
    
	
    
    
    
}
