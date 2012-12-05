raptor.define(
    "jsdoc.Tag",
    function(raptor) {
        "use strict";
        
        var Tag = function(name, value) {
            this.name = name;
            this.value = value;
        };
        
        Tag.prototype = {
            getName: function() {
                return this.name;
            },
            
            getValue: function() {
                return this.value;
            },
            
            toString: function() {
                return "@" + this.name + " " + this.value;
            }
        };
        
        return Tag;
        
        
    });