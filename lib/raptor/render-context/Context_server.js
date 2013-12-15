define.extend('raptor/render-context/Context', function() {
    'use strict';
    
    return {
        uniqueId: function() {
            var attrs = this.attributes;
            if (!attrs._nextId) {
                attrs._nextId = 0;
            }
            
            return attrs._nextId++;
        }
    };
});