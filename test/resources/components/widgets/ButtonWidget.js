define.Class(
    'components/widgets/ButtonWidget',
    function(require) {
        return {
            init: function(config) {
                this.label = config.label;
                console.error('Button initialized!', config);
            },

            getLabel: function() {
                return this.label;
            }
        };
    }
);