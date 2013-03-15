define(
    'raptor/widgets/WidgetsContext', 
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var WidgetDef = require('raptor/widgets/WidgetDef');
        
        var WidgetsContext = function(context) {
            this.context = context;
            this.widgets = [];
            this.widgetStack = [];
        };

        WidgetsContext.prototype = {
            
            beginWidget: function(config, callback) {
                
                var _this = this,
                    widgetStack = _this.widgetStack,
                    lastWidgetIndex = widgetStack.length,
                    parent = lastWidgetIndex ? widgetStack[lastWidgetIndex-1] : null;
                
                if (!config.id) {
                    config.id = _this._nextWidgetId();
                }
                
                if (config.assignedId && !config.scope) {
                    throw raptor.createError(new Error('Widget with an assigned ID "' + config.assignedId + '" is not scoped within another widget.'));
                }
                
                config.parent = parent;
                
                var widgetDef = new WidgetDef(config);
                
                if (parent) { //Check if it is a top-level widget
                    parent.addChild(widgetDef);
                }
                else {
                    _this.widgets.push(widgetDef);
                }
                
                widgetStack.push(widgetDef);

                try
                {
                    callback(widgetDef);    
                }
                finally {
                    widgetStack.splice(lastWidgetIndex, 1);
                }
            },
            
            hasWidgets: function() {
                return this.widgets.length !== 0;
            },

            clearWidgets: function() {
                this.widgets = [];
                this.widgetStack = [];
            },
            
            _nextWidgetId: function() {
                return 'w' + this.context.uniqueId();
            }
        };
        
        
        
        return WidgetsContext;
    });