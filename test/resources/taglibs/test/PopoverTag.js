define.Class(
    'taglibs.test.PopoverTag',
    function(require) {
        
        return {
            process: function(input, context) {
                
                require('raptor/templating').render('taglibs/test/Popover', {
                    content: input.content,
                    title: input.title,
                    tag: input
                }, context);
            }
        };
    }
);