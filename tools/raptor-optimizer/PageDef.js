
var PageDef = function() {
    this.includes = [];
    this.name = null;
    this.bundleSetDef = null;
    this.config = null;
    this.enabledExtensions = null;
};

PageDef.prototype = {
    enableExtension: function(name) {
        if (!this.enabledExtensions) {
            this.enabledExtensions = {};
        }
        this.enabledExtensions[name] = true;
        
    },
    addInclude: function(include) {
        this.includes.push(include);
    },
    
    getBundleSetDef: function() {
        return this.bundleSetDef || this.config.getBundleSetDef("default");
    },
    
    getEnabledExtensions: function() {
        return this.enabledExtensions ? Object.keys(this.enabledExtensions) : this.config.getEnabledExtensions();
    },
    
    addBundleSetDef: function(bundleSetDef) {
        if (this.bundleSetDef) {
            raptor.throwError(new Error('Page "' + this.name + '" already has bundles defined"'));
        }
        this.bundleSetDef = bundleSetDef;
    },
    toString: function() {
        return "[PageDef name=" + this.name + "]";
    }
}

module.exports = PageDef;