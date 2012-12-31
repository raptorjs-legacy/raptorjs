package org.raptorjs.resources.packaging;

import java.util.ArrayList;
import java.util.List;

import org.mozilla.javascript.ScriptableObject;
import org.raptorjs.rhino.RaptorJSEnv;

public class Extension {
    
    public List<Dependency> dependencies = new ArrayList<Dependency>();
    
    private Condition condition = null;
    private String name = null;

    /**
	 * @deprecated Use {@link #getDependencies()} instead
	 */
	public List<Dependency> getIncludes() {
		return getDependencies();
	}

	public List<Dependency> getDependencies() {
        return dependencies;
    }

    public void addInclude(Dependency dependency) {
        this.dependencies.add(dependency);
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
        return "Extension [includes=" + dependencies + "]";
    }
}
