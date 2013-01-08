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
    
    private BootstrapHelper bootstrap = null;
    private FilesHelper files = null;
    private JavaHelper java = null;
    private RuntimeHelper runtime = null;
    private ConsoleHelper console = null;
    private StacktraceHelper stacktrace = null;
    private ResourcesHelper resources = null;
    private XmlHelper xml = null;
    private WidgetsHelper widgets = null;
    
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
    
    protected WidgetsHelper createWidgetsHelper() {
        return new WidgetsHelper();
    }
    
    protected XmlHelper createXml() {
        return new XmlHelper();
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

	public XmlHelper getXml() {
		return xml;
	}
	
	

	public WidgetsHelper getWidgets() {
		return widgets;
	}

	public RaptorJSEnv getRaptorJSEnv() {
		return raptorJSEnv;
	}
    
	
    
    
    
}
