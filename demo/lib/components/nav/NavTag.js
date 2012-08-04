raptor.define(
    "components.nav.NavTag",
    function(raptor) {
        var NavTag = function() {
            
        };
        
        NavTag.prototype = {
            process: function(input, context) {
                
                var rootAttrs = {};
                
                var classParts = ["nav"];
                
                if (input.type) {                    
                    classParts.push("nav-" + input.type);
                }
                
                if (input.stacked) {
                    classParts.push("nav-stacked");
                }
                
                rootAttrs["class"] = classParts.join(" ");
                
                var widgetConfig = {};

                var navItems = [];
                var activeFound = false;
                
                input.invokeBody({
                    addNavItem: function(navItem) {
                        var liClassParts = [];
                        
                        if (navItem.active) {
                            activeFound = true;
                            liClassParts.push("active");
                        }
                        navItem.attrs = {};
                        
                        if (liClassParts.length) {
                            navItem.attrs["class"] = liClassParts.join(" ");
                        }
                        
                        if (navItem["*"]) {
                            raptor.extend(navItem.attrs, navItem["*"]);
                        }
                        
                        navItem.anchorAttrs = {};
                        
                        if (navItem.toggle) {
                            navItem.anchorAttrs["href"] = "#" + navItem.toggle;
                            navItem.anchorAttrs["data-toggle"] = (input.type === 'pills' ? 'pill' : 'tab');
                        }
                        else {
                            navItem.anchorAttrs["href"] = navItem.href ? navItem.href : "#";
                        }
                        
                        navItems.push(navItem);
                    }
                });
                
                if (!activeFound && navItems.length) {
                    navItems[0].attrs["class"] = navItems[0].attrs["class"] ? navItems[0].attrs["class"] + " active" : "active"; 
                }
                
                raptor.require('templating').render('components/nav/Nav', {
                    navItems: navItems,
                    rootAttrs: rootAttrs,
                    widgetContext: input.widgetContext,
                    widgetConfig: widgetConfig
                }, context);
            }
        };
        
        return NavTag;
    });