define.Class(
    'raptor/optimizer/SlotTracker',
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var Slot = require('raptor/optimizer/Slot');

        var SlotTracker = function() {
            this.slots = {};
        };
        
        SlotTracker.prototype = {
            addContent: function(slotName, contentType, content, inline) {
                var slot = this.slots[slotName] || (this.slots[slotName] = new Slot());
                slot.addContent(contentType, content, inline);
                
            },
            getHtmlBySlot: function() {
                var htmlBySlot = {};
                raptor.forEachEntry(this.slots, function(slotName, slot) {
                    htmlBySlot[slotName] = slot.buildHtml();
                });
                
                return htmlBySlot;
            }
        };

        return SlotTracker;
    });
