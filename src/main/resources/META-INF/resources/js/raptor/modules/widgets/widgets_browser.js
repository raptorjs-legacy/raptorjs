/**
* @extension Browser
* 
*/
raptor.extend('widgets', function(raptor) {
    var PROTOTYPE = 'prototype',
        widgetsById = {},
        errors = raptor.errors,
        listeners = raptor.listeners,
        EVENTS = 'events',
        Widget = raptor.require('widgets.Widget'),
        arrayFromArguments = raptor.arrayFromArguments;

    return {
        /**
         * 
         * @param {...widgets} widgets An array of widget definitions
         * @returns {void}
         */
        initAll: function(widgets) {
            
            var logger = this.logger();
            
            var _initWidget = function(widget, config, type) {
                    try
                    {
                        widget.init(config);
                    }
                    catch(e) {
                        logger.error('Unable to initialize widget of type "' + type + "'. Exception: " + e, e);
                    }
                },
                _initWidgetOnReady = function(widget, config, type) {
                    widget.onReady(function() {
                        _initWidget(widget, config, type);
                    });
                },
                
                _notify = function(name, args) {
                    return this.publish(name, arrayFromArguments(arguments, 1));
                },
                _initWidgets = function(widgetDefs, parentWidget) {
                    if (!widgetDefs) return;
                    
                    var i=0,
                        len = widgetDefs.length;
                    
                    for (; i<len; i++) {
                        
                        var widgetDef = widgetDefs[i], 
                            type = widgetDef[0],
                            id = widgetDef[1],
                            childId = widgetDef[2],
                            config = widgetDef[3] || {},
                            children = widgetDef[4];
                        
                        logger.debug('Creating widget of type "' + type + '" (' + id + ')');
                        
                        var originalWidgetClass = raptor.find(type);
                        if (!originalWidgetClass)
                        {
                            errors.throwError(new Error('Unable to initialize widget of type "' + type + '". The class for the widget was not found.'));
                        }
                        
                        var WidgetClass = Widget._init,
                            proto;
                        
                        
                        WidgetClass[PROTOTYPE] = proto = originalWidgetClass[PROTOTYPE];
                        
                        proto.init = originalWidgetClass;
                        
                        if (!proto._isWidget)
                        {
                            raptor.extend(proto, Widget, false /* don't override */);
                        }
                        
                        var widget = new WidgetClass();
                        
                        listeners.makeObservable(widget, proto);
                        
                        if (!proto.notify) {
                            proto.notify = _notify;
                            proto.on = proto.subscribe;
                        }
                        
                        widget.registerMessages(['beforeDestroy', 'destroy'], false);
                        
                        if (proto.hasOwnProperty(EVENTS)) {
                            widget.registerMessages(proto[EVENTS], false);
                        }
                        
                        
                        
                        widget._id = id;
                        widget._childId = childId;
                        widgetsById[id] = widget;
                        
                        if (children) {
                            _initWidgets(children, widget);
                        }

                        if (widget.initBeforeOnDomReady === true) {
                            _initWidget(widget, config, type);
                        }
                        else {
                            _initWidgetOnReady(widget, config, type);
                        }
                        
                        if (parentWidget) {
                            parentWidget._addChild(widget);
                        }

                    }

                };
                
            _initWidgets(arguments);
        },
        
        /**
         * Gets a widget by widget ID
         * @param {string} id The ID of the widget
         * @returns {object} The widget instance
         */
        get: function(id) {
            return widgetsById[id];
        }
    };
});
