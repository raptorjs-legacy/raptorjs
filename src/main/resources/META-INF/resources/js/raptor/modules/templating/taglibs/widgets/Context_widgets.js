raptor.extend(
        'templating.Context',
        function() {
            var widgets = raptor.require('widgets'),
                getWidgetsData = function(context) {
                    var widgetsData;
                    if (!(widgetsData = context.attributes.widgets)) {
                        widgetsData = context.attributes.widgets = {
                            widgets: [],
                            nextDocId: 0
                        };
                        
                        context.subscribe("renderedToDOM", context.initWidgets, context);
                    }
                    return widgetsData;
                };
            
            return {
                
                addWidget: function(widgetDef) {
                    getWidgetsData(this).widgets.push(widgetDef);
                    return widgetDef;
                },
                
                widgetDoc: function() {
                    return getWidgetsData(this).nextDocId++;
                },
                
                initWidgets: function() {
                    throw new Error("Not Implemented");
                }
            };
        }
    );