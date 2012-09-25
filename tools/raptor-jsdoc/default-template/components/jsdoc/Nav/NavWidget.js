raptor.define(
    "components.jsdoc.Nav.NavWidget",
    function(raptor) {
        var NavWidget = function(config) {
            
            $('#navTree').jstree({
                "core" : {
                    initially_open: config.initiallyOpenId ? [config.initiallyOpenId] : []
                },
                "plugins" : ["html_data","crrm"]
            });




            var rootEl = this.getEl();
            setTimeout(function() {
                rootEl.style.visibility = "visible";
                console.error(config.activeElId);
                if (config.activeElId) {
                    $("#" + config.activeElId).addClass("active");
                }

            }, 0);


            
        };
        
        
        NavWidget.prototype = {
            
        };
        
        return NavWidget;
    });