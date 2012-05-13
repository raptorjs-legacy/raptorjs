raptorBuilder.addLoader(function(raptor) {
    raptor.defineClass('resources.SearchPath', function(raptor) {
    
        var forEach = raptor.forEach,
            listeners = raptor.listeners,
            DirSearchPathEntry = raptor.require('resources.DirSearchPathEntry');
        
        var SearchPath = function() {
            this.entries = [];
            listeners.makeObservable(this, SearchPath.prototype, ['modified'], false);
        };
        
        SearchPath.prototype = {
            addEntry: function(entry) {
                this.entries.push(entry);
                this.publish('modified');
            },

            addDir: function(path) {
                this.addEntry(new DirSearchPathEntry(path));
            },
            
            forEachEntry: function(callback, thisObj) {
                forEach(this.entries, callback, thisObj);
            }
        };
        
        return SearchPath;
    });
});