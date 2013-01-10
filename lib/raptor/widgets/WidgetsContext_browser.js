define.extend('raptor/widgets/WidgetsContext', function(require, target) {
    "use strict";
    
    var nextWidgetId = 0;
    
    return {
        _nextWidgetId: function() {
            return 'c' + nextWidgetId++;
        },

        initWidgets: function() {
            var widgetDefs = this.widgets,
                widgets = require('raptor/widgets');

            widgetDefs.forEach(function(widgetDef) {
                widgets.initWidget(widgetDef);
            });

            this.clearWidgets();
        }
    };
});