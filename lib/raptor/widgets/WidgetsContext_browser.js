define.extend('raptor/widgets/WidgetsContext', function(require, target) {
    "use strict";
    
    var nextWidgetId = 0;
    
    return {
        _nextWidgetId: function() {
            return 'c' + nextWidgetId++;
        }
    };
});