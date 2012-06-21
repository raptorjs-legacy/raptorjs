raptor.defineClass(
    'templating.taglibs.widgets.InitWidgetsTag',
    function(raptor) {
        var widgets = raptor.require('widgets');
        
        return {
            process: function(input, context) {
                if (!widgets.hasWidgets(context)) {
                    return;
                }
                
                var includeScriptTag = input.includeScriptTag !== true;
                
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