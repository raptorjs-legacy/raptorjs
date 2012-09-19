raptor.define(
    "jsdocs.Symbol",
    function(raptor) {
        "use strict";
        
        var Symbol = function(name, type, comment) {
            this.name = name;
            this.type = type;
            this.anonymous = false;
            this.comment = comment;
        };
        
        Symbol.prototype = {
            getName: function() {
                return this.name;
            },
                
            getType: function() {
                return this.type;
            },
            
            toString: function() {
                return "[" + this.getClass().getName() + ": " + this.getName() + " --> " + this.getType() + "]";
            },
            
            setAnonymous: function(anon) {
                this.anonymous = anon === true;
            },
            
            isAnonymous: function() {
                return this.anonymous;
            },
            
            hasComment: function() {
                return this.comment != null;
            },
            
            getComment: function() {
                return this.comment;
            },
            
            setComment: function(comment) {
                this.comment = comment;
            }
        };
        
        return Symbol;
        
        
    });