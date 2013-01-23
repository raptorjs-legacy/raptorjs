define('raptor/widgets/WidgetDef', ['raptor'], function(raptor, require, exports, module) {
    "use strict";

    var WidgetDef = function(config) {
        /*
        this.type = null;
        this.id = null;
        this.assignedId = null;
        this.config = null;
        this.scope = null;
        this.events = null;
        this.parent = null;
        */
        
        this.children = [];
        
        raptor.extend(this, config);
    };

    WidgetDef.prototype = {
        a: function() {

        },

        addChild: function(widgetDef) {
            this.children.push(widgetDef);
        },
        
        elId: function(name) {
            if (arguments.length === 0) {
                return this.id;
            }
            else {
                return this.id + "-" + name;
            }
        }
    };
    
    return WidgetDef;
});