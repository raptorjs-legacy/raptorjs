define('raptor/templating/taglibs/widgets/WidgetFunctions', function (require) {
    'use strict';
    return {
        widgetArgs: function (assignedId, scope, events) {
            this.attributes.widgetArgs = {
                id: assignedId,
                scope: scope,
                events: events
            };
        },
        cleanupWidgetArgs: function () {
            delete this.attributes.widgetArgs;
        }
    };
});