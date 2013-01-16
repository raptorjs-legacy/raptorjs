define.extend('raptor/render-context/Context', function() {
    
    
    return {
        uniqueId: function() {
            var attrs = this.getAttributes();
            if (!attrs._nextId) {
                attrs._nextId = 0;
            }
            
            return attrs._nextId++;
        }
    };
});