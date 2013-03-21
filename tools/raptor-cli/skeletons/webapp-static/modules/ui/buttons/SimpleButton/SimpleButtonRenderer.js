define(
    "ui/buttons/SimpleButton/SimpleButtonRenderer",
    function(require) {
        var templating = require('raptor/templating');

        return {
            render: function(input, context) {
                templating.render(
                    'ui/buttons/SimpleButton',
                    {
                        label: input.label
                    },
                    context);
            }
        };
    });