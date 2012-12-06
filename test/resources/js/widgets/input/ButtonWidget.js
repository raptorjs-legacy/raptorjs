define.Class('widgets.input.ButtonWidget', function(raptor, require, exports, module) {
    var logger = module.logger();
    
    return {
        initBeforeOnDomReady: true,
        
        init: function(config) {
            this.initInvoked = true;
            if (config == null) {
                throw new Error('Config is null');
            }
            logger.debug('Config: ' + JSON.stringify(config));
            this.config = config;
            this.label = config.label;
        },
        
        getLabel: function() {
            return this.label;
        }
    };
});