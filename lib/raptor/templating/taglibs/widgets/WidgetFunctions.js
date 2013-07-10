define(
    'raptor/templating/taglibs/widgets/WidgetFunctions',
    function(require) {
        "use strict";
        
        var widgets = require('raptor/widgets');
        
        return {
            widgetArgs: function(assignedId, scope, events) {
                this.attributes.widgetArgs = {
                    id: assignedId,
                    scope: scope,
                    events: events
                };
            }
        };
    });