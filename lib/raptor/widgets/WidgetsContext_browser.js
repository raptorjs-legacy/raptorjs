define.extend('raptor/widgets/WidgetsContext', function(require, target) {
    "use strict";
    
    return {
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