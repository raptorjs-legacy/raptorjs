raptor.define(
    "components.nav.TabPane.TabPaneTag",
    function(raptor) {
        var TabPaneTag = function() {
            
        };
        
        TabPaneTag.prototype = {
            process: function(input, context) {
                
                var rootAttrs = {};
                
                var classParts = ["tab-pane"];
                
                if (input["class"]) {
                    classParts.push(input["class"]);
                }
                
                if (input.fade) {
                    classParts.push("fade");
                    
                    if (input.active) {
                        classParts.push("in");
                    }
                }

                if (input.active) {
                    classParts.push("active");                    
                }
                
                rootAttrs["class"] = classParts.join(" ");
                
                if (input.id) {
                    rootAttrs["id"] = input.id;    
                }
                
                
                
                raptor.require('templating').render('components/nav/TabPane', {
                    tag: input,
                    rootAttrs: rootAttrs
                }, context);
            }
        };
        
        return TabPaneTag;
    });