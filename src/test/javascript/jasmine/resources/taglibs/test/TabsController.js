raptor.defineClass(
    'taglibs.test.TabsController',
    function(raptor) {
        var templating = raptor.require("templating");
        
        var TabsController = function() {
            
        };
        
        TabsController.prototype = {
            process: function(input, context) {
                var tabs = [],  
                    activeFound = false;
                
                input.invokeBody({
                    addTab: function(tab) {
                        if (tab.active) {
                            tab.activeFound = true;
                        }
                        
                        tab.id = "tab" + tabs.length;
                        tabs.push(tab);
                    }
                });
                
                if (!activeFound && tabs.length) {
                    tabs[0].active = true;
                }
                
                raptor.forEach(tabs, function(tab) {
                    tab.liClass = tab.active ? "active" : "";
                    tab.divClass = tab.active ? "tab-pane active" : "tab-pane";
                });
                
                
                
                templating.render("test/Tabs", {
                    tabs: tabs
                }, context);
                
            }
        };
        
        return TabsController;
    });