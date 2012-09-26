raptor.define(
    "components.jsdoc.Nav.NavWidget",
    function(raptor) {
        var NavWidget = function(config) {
            
            $('#navTree').jstree({
                "core" : {
                    initially_open: config.initiallyOpenId ? [config.initiallyOpenId] : []
                },
                "plugins" : ["html_data","crrm"]
            }).on("click", "a", function (event, data) {
                console.error("CLICK", this, this.parentNode);
                if ($(this).attr("href").charAt(0) === '#') {
                    $("#navTree").jstree("toggle_node", $(this.parentNode));
                    event.preventDefault();     
                }
                
            });




            var rootEl = this.getEl();
            setTimeout(function() {
                rootEl.style.visibility = "visible";
                if (config.activeElId) {
                    $("#" + config.activeElId).addClass("active");
                }

            }, 0);


            
        };
        
        
        NavWidget.prototype = {
            
        };
        
        return NavWidget;
    });