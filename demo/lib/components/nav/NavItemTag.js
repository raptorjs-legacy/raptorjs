raptor.define(
    "components.nav.NavItemTag",
    function(raptor) {
        var NavItemTag = function() {
            
        };
        
        NavItemTag.prototype = {
            process: function(input, context) {
                
                input.nav.addNavItem(input);
            }
        };
        
        return NavItemTag;
    });