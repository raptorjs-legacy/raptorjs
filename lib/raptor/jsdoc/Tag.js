define.Class(
    "raptor/jsdoc/Tag",
    function(require, exports, module) {
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

console.error("raptor/jsdoc/Tag : ", require('raptor/jsdoc/Tag').toString());