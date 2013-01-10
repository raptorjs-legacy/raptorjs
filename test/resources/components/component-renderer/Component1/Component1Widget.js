define(
    'components/component-renderer/Component1/Component1Widget',
    function(require) {
        var Component1Widget = function(config) {
            Component1Widget.initOrder.push(config.id);
        };

        Component1Widget.prototype = {

        };

        Component1Widget.initOrder = [];


        return Component1Widget;
    });