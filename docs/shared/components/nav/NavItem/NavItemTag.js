raptor.define(
    "components.nav.NavItem.NavItemTag",
    function(raptor) {
        var NavItemTag = function() {
            
        };
        
        NavItemTag.prototype = {
            process: function(input, context) {
                var liClassParts = [];
                
                if (input.active) {
                    activeFound = true;
                    liClassParts.push("active");
                }
                input.attrs = {};
                
                if (liClassParts.length) {
                    input.attrs["class"] = liClassParts.join(" ");
                }
                
                if (input["*"]) {
                    raptor.extend(input.attrs, input["*"]);
                }
                
                input.anchorAttrs = {};
                
                if (input.toggle) {
                    input.anchorAttrs["href"] = "#" + input.toggle;
                    input.anchorAttrs["data-toggle"] = (input.type === 'pills' ? 'pill' : 'tab');
                }
                else {
                    input.anchorAttrs["href"] = input.href ? input.href : "#";
                }
                input.render = function() {
                    raptor.require('templating').render('components/nav/NavItem', {
                        navItem: input
                    },
                    context);
                };
                
                input.nav.addNavItem(input);
            }
        };
        
        return NavItemTag;
    });