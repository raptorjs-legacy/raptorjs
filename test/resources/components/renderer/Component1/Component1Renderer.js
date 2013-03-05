define(

    'components/renderer/Component1/Component1Renderer',
    function(require) {
        return {
            render: function(input, context) {
                require('raptor/templating').render('components/renderer/Component1', {
                    id: input.id,
                    widgetConfig: {
                        id: input.id
                    }
                }, context);
            }
        }
    });