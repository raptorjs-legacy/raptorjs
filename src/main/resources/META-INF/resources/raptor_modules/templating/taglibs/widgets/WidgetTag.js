raptor.defineClass(
    'templating.taglibs.widgets.WidgetTag',
    function(raptor) {
        "use strict";
        
        var widgets = raptor.require('widgets');
        
        return {
            process: function(input, context) {
                var type = input.jsClass,
                    config = input.config,
                    widgetContext = input.widgetContext,
                    id = input.id,
                    parent,
                    nestedWidgetId;
                
                if (widgetContext) {
                    parent = widgetContext[0];
                    nestedWidgetId = widgetContext[1];
                }

                var widget = widgets.addWidget(type, id, nestedWidgetId, config, parent, context);
                
                input.invokeBody(widget);
            }
        };
    });