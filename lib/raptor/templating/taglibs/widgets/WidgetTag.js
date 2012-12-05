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
                
                var attributes = context.getAttributes();
                
                var widgetStack = attributes.widgetStack || (attributes.widgetStack = []);
                var widget = widgets.addWidget(type, id, assignedId, config, widgetStack[widgetStack.length-1], scope, events, context);
                
                widgetStack.push(widget);
                try
                {
                    input.invokeBody(widget);    
                }
                finally {
                    widgetStack.splice(widgetStack.length-1, 1);
                }
                
            }
        };
    });