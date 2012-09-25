raptor.define(
    "components.jsdoc.Type.TypeWidget",
    function(raptor) {
        var TypeWidget = function(config) {
            var _this = this;

            this.$().on("click", ".expand-collapse-bar", function(event){
                _this.toggleMore(this, this.getAttribute("data-more-target"));
            });

            $("#expandAll").click(function() {
                _this.expandAll();
            });

            $("#collapseAll").click(function() {
                _this.collapseAll();
            });

            if (window.sh_highlightDocument) {
                sh_highlightDocument();
            }
        };
        
        
        TypeWidget.prototype = {
            toggleMore: function(linkEl, moreElId) {
                $("#" + moreElId).slideToggle();
                $(linkEl).toggleClass("expanded")
            },

            expandAll: function() {
                this.$(".expand-collapse-bar").addClass("expanded");
                this.$(".more").slideDown();
            },
            
            collapseAll: function() {
                this.$(".expand-collapse-bar").removeClass("expanded");
                this.$(".more").slideUp();
            }
        };
        
        return TypeWidget;
    });