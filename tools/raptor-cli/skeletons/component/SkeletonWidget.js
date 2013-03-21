define.Class(
    '{longName}/{shortName}Widget',
    function(require, exports, module) {
        var logger = module.logger();

        return {
            init: function(widgetConfig) {
                this.$().click(function() {
                    this.setColor('red');

                    this.publish('click', {
                        widget: this
                    });
                }.bind(this));
            },

            events: ['click'],

            renderer: '{longName}/{shortName}Renderer',

            setColor: function(color) {
                this.getEl().style.backgroundColor = color;
            }
        };
    });