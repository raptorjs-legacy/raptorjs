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

            var defaultSearchValue = "Search API docs";

            $("#searchInput").focus(function() {
                if ($(this).val() == defaultSearchValue) {
                    $(this).val("");
                }
            }).blur(function() {
                if ($(this).val() == "") {
                    $(this).val(defaultSearchValue);
                }
            }).autocomplete(autocompleteSymbols, {
              formatItem: function(item) {
                return '<span class="ac-icon ac-icon-' + item.type + '"></span> ' + item.text;
              },
              formatResult: function(item) {
                return item.text;
              },
              matchContains: true,
              max: 50,
              width: 500
            }).result(function(event, item) {
              location.href = item.url;
            });


            
        };
        
        
        NavWidget.prototype = {
            
        };
        
        return NavWidget;
    });