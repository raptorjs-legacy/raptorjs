raptor.define(
    "components.nav.Nav.NavWidget",
    function(raptor) {
        var NavWidget = function(config) {
            var _this = this; 
            this.$("LI").click(function() {
                _this.publish('navItemClick', {
                    el: this,
                    nav: _this
                });
            });
        };
        
        NavWidget.events = ["navItemClick"]
        
        NavWidget.prototype = {
            
        };
        
        return NavWidget;
    });