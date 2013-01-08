define.extend('raptor/widgets/WidgetsContext', function(require, target) {
    "use strict";
    
    return {
        _nextWidgetId: function() {
            return "s" + this.context.uniqueId();
        }
    };
});