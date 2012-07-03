raptor.defineClass(
    'templating.taglibs.widgets.InitWidgetsTag',
    function(raptor) {
        "use strict";
        
        var widgets = raptor.require('widgets');
        
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