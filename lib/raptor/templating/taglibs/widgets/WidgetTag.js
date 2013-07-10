define.Class(
    'raptor/templating/taglibs/widgets/WidgetTag',
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var widgets = require('raptor/widgets');
        
        return {
            render: function(input, context) {
                var type = input.jsClass,
                    config = input.config || input._cfg,
                    widgetArgs = context.attributes.widgetArgs,
                    elId = input.elId,
                    scope = input.scope,
                    assignedId = input.assignedId,
                    events;
                
                if (!elId && input.hasOwnProperty('elId')) {
                    throw raptor.createError('Invalid widget ID for "' + type + '"');
                }
                
                if (widgetArgs) {
                    delete context.attributes.widgetArgs;
                    scope = scope || widgetArgs.scope;
                    assignedId = assignedId || widgetArgs.id;
                    events = widgetArgs.events;
                }
                
                var widgetsContext = widgets.getWidgetsContext(context);
                
                widgetsContext.beginWidget({
                        type: type,
                        id: elId,
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