define(
    "components.jsdoc.Type.TypeWidget",
    ['raptor'],
    function(raptor, require) {
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

            var hash = document.location.hash;
            if (hash) {
                var activeProperty = hash;
                if (activeProperty.charAt(0) === '#') {
                    activeProperty = activeProperty.substring(1);
                }

                this.expandProperty(activeProperty);
            }
        };
        
        
        TypeWidget.prototype = {
            expandProperty: function(propertyName) {
                var moreSection = document.getElementById(propertyName + "-more");
                var propertyEl = document.getElementById(propertyName);
                if (propertyEl) {
                    propertyEl = propertyEl.parentNode;
                }
                
                $(moreSection).slideDown();
                $(".expand-collapse-bar", propertyEl).addClass("expanded");
            },

            toggleMore: function(linkEl, moreElId) {
                $(document.getElementById(moreElId)).slideToggle();
                $(linkEl).toggleClass("expanded");
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