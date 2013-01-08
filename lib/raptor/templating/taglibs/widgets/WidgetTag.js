define.Class(
    'raptor/templating/taglibs/widgets/WidgetTag',
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var widgets = require('raptor/widgets');
        
        return {
            process: function(input, context) {
                var type = input.jsClass,
                    config = input.config,
                    widgetArgs = input.widgetArgs,
                    id = input.id,
                    scope,
                    assignedId,
                    events;
                
                if (widgetArgs) {
                    scope = widgetArgs.scope;
                    assignedId = widgetArgs.id;
                    events = widgetArgs.events;
                }
                
                var widgetsContext = widgets.getWidgetsContext(context);
                widgetsContext.beginWidget({
                        type: type,
                        id: id,
                        assignedId: assignedId,
                        config: config,
                        scope: scope,
                        events: events
                    }, function(widgetDef) {
                        input.invokeBody(widgetDef);
                    });
                
            }
        };
    });