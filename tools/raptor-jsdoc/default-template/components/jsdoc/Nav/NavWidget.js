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
        };
        
        
        NavWidget.prototype = {
            
        };
        
        return NavWidget;
    });