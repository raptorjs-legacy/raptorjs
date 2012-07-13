var BundleSetDef = function() {
    this.name = null;
    this.ref = null;
    this.children = [];
};

BundleSetDef.prototype = {
    addChild: function(child) {
        this.children.push(child);
    },
    toString: function() {
        return "[BundleSetDef name=" + this.name + "]";
    },
    forEachChild: function(callback, thisObj) {
        raptor.forEach(this.children, callback, thisObj);
    }
}

module.exports = BundleSetDef;