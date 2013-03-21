define(
    '{longName}/{shortName}Renderer',
    function(require) {
        var templating = require('raptor/templating');

        return {
            render: function(input, context) {
                templating.render('{longName}', {
                    name: input.name,
                    count: input.count
                }, context);
            }
        };
        
        return ButtonTag;
    });