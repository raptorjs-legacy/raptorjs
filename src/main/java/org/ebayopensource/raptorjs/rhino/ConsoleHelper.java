package org.ebayopensource.raptorjs.rhino;

public class ConsoleHelper {
    private RaptorJSEnv raptorJS = null;

    public ConsoleHelper(RaptorJSEnv raptorJS) {
        super();
        this.raptorJS = raptorJS;
    }
    
    public void log(Object o) {
        System.out.println(o);
    }
    
    public void error(Object o) {
        System.err.println(o);
    }

    public RaptorJSEnv getRaptorJS() {
        return raptorJS;
    }
    
    
}
