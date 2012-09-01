raptor.defineClass(
    'templating.taglibs.widgets.WidgetTag',
    function(raptor) {
        "use strict";
        
        var widgets = raptor.require('widgets');
        
        return {
            process: function(input, context) {
                var type = input.jsClass,
                    config = input.config,
                    widgetArgs = input.widgetArgs,
                    id = input.id,
                    parent,
                    nestedWidgetId;
                
                if (widgetArgs) {
                    parent = widgetArgs[0];
                    nestedWidgetId = widgetArgs[1];
                }

                var widget = widgets.addWidget(type, id, nestedWidgetId, config, parent, context);
                
                input.invokeBody(widget);
            }
        };
    });