define.Class(
    'templating.taglibs.widgets.InitWidgetsTag',
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var widgets = require('raptor/widgets');
        
        return {
            process: function(input, context) {
                if (!widgets.hasWidgets(context)) {
                    return;
                }
                
                var includeScriptTag = input.includeScriptTag !== false;
                
                if (includeScriptTag) {
                    context.write('<script type="text/javascript">');
                }
                
                widgets.writeInitWidgetsCode(context, true);
                
                if (includeScriptTag) {
                    context.write('</script>');
                }
            }
        };
    });