package org.raptorjs.resources.packaging;

import java.util.ArrayList;
import java.util.List;

import org.mozilla.javascript.ScriptableObject;
import org.raptorjs.rhino.RaptorJSEnv;

public class Extension {
    
    public List<Include> includes = new ArrayList<Include>();
    
    private Condition condition = null;
    private String name = null;

    public List<Include> getIncludes() {
        return includes;
    }

    public void addInclude(Include include) {
        this.includes.add(include);
    }
    
    
    public Condition getCondition() {
        return condition;
    }

    public void setCondition(Condition condition) {
        this.condition = condition;
    }

    public String getName() {
        return name;
    }

    public boolean checkCondition(RaptorJSEnv jsEnv, ScriptableObject extensionCollection){
        return this.condition.checkCondition(jsEnv, extensionCollection);
    }


    public void setName(String name) {
        this.name = name;
    }
    
    public boolean hasCondition() {
        return this.condition != null;
    }

    @Override
    public String toString() {
        return "Extension [includes=" + includes + "]";
    }
}
