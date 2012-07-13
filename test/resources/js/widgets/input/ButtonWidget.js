raptor.defineClass('widgets.input.ButtonWidget', function(raptor) {
    return {
        initBeforeOnDomReady: true,
        
        init: function(config) {
            this.initInvoked = true;
            if (config == null) {
                throw new Error('Config is null');
            }
            this.logger().debug('Config: ' + JSON.stringify(config));
            this.config = config;
            this.label = config.label;
        },
        
        getLabel: function() {
            return this.label;
        }
    };
});