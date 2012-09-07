raptor.defineClass(
    'taglibs.test.PopoverTag',
    function(raptor) {
        
        return {
            process: function(input, context) {
                
                raptor.require('templating').render('taglibs/test/Popover', {
                    content: input.content,
                    title: input.title,
                    tag: input
                }, context);
            }
        };
    }
);