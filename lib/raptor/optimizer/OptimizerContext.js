define.Class(
    'raptor/optimizer/OptimizerContext',
    function(require) {
        "use strict";
        var listeners = require('raptor/listeners');

        
        var OptimizerContext = function() {
            this._ob = listeners.createObservable();
        };
        
        OptimizerContext.prototype = {
            onBeforeSlot: function(slotName, cb) {
                this._ob.on('beforeSlot.' + slotName, cb);
            },

            onAfterSlot: function(slotName, cb) {
                this._ob.on('afterSlot.' + slotName, cb);
            },

            emitBeforeSlot: function(slotName, context) {
                this._ob.publish('beforeSlot.' + slotName, {
                    context: context,
                    slotName: slotName
                });
            },

            emitAfterSlot: function(slotName, context) {
                this._ob.publish('afterSlot.' + slotName, {
                    context: context,
                    slotName: slotName
                });
            }
        };
        
        return OptimizerContext;
        
        
    });