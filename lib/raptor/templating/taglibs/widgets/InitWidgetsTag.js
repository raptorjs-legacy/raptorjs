define.Class('raptor/templating/taglibs/widgets/InitWidgetsTag', ['raptor'], function (raptor, require) {
    'use strict';
    var widgets = require('raptor/widgets');
    return {
        process: function (input, context) {
            var widgetsContext = widgets.getWidgetsContext(context);
            if (!widgetsContext.hasWidgets()) {
                return;
            }
            var includeScriptTag = input.includeScriptTag !== false;
            if (includeScriptTag) {
                context.write('<script type="text/javascript">');
            }
            var funcName = input.functionName;
            if (funcName) {
                context.write('function ' + funcName + '(){\n');
            }
            widgets.writeInitWidgetsCode(context, true);
            if (funcName) {
                context.write('\n}');
            }
            if (includeScriptTag) {
                context.write('</script>');
            }
        }
    };
});