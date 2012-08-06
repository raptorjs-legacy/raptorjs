raptor.define(
    "components.nav.NavBar.NavBarTag",
    function(raptor) {
        var NavBarTag = function() {
            
        };
        
        NavBarTag.prototype = {
            process: function(input, context) {
                
                var rootAttrs = {};
                
                var classParts = ["navbar"];
                
                if (input.type) {                    
                    classParts.push("navbar-" + input.type);
                }
                
                rootAttrs["class"] = classParts.join(" ");

                raptor.require('templating').render('components/nav/NavBar', {
                    rootAttrs: rootAttrs,
                    brand: input.brand,
                    tag: input
                }, context);
            }
        };
        
        return NavBarTag;
    });