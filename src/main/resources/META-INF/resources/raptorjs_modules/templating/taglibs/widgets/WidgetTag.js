raptor.defineClass(
    'templating.taglibs.widgets.WidgetTag',
    function(raptor) {
        var widgets = raptor.require('widgets');
        
        return {
            process: function(input, context) {
                var type = input.jsClass,
                    config = input.config,
                    widgetContext = input.widgetContext,
                    id = input.id,
                    parent,
                    childId;
                
                if (widgetContext) {
                    parent = widgetContext[0];
                    childId = widgetContext[1];
                }

                var widget = widgets.addWidget(type, id, childId, config, parent, context);
                
                input.invokeBody(widget);
            }
        };
    });