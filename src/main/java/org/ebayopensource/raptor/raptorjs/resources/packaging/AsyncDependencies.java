package org.ebayopensource.raptor.raptorjs.resources.packaging;

import java.util.LinkedList;
import java.util.List;

public class AsyncDependencies {
    private List<String> jsUrls = new LinkedList<String>();
    private List<String> cssUrls = new LinkedList<String>();
    private List<String> requires = new LinkedList<String>();
    
    
    public AsyncDependencies(List<String> requires, List<String> jsUrls,
            List<String> cssUrls) {
        super();
        this.requires = requires;
        this.jsUrls = jsUrls;
        this.cssUrls = cssUrls;
    }
    public void addJavaScriptUrl(String url) {
        this.jsUrls.add(url);
    }
    public void addAllJavaScriptUrls(List<String> urls) {
        this.jsUrls.addAll(urls);
    }
    
    public void addStyleSheetUrl(String url) {
        this.cssUrls.add(url);
    }
    
    public void addAllStyleSheetUrls(List<String> urls) {
        this.cssUrls.addAll(urls);
    }
    
    public void addRequire(String name) {
        this.requires.add(name);
    }
    
    public List<String> getJsUrls() {
        return jsUrls;
    }

    public List<String> getCssUrls() {
        return cssUrls;
    }

    public List<String> getRequires() {
        return requires;
    }

}
