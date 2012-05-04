raptor.defineClass(
    'raptor.WidgetJSCompiler',
    function(raptor) {
        var WidgetJSCompiler = function() {
            
        };
        
        WidgetJSCompiler.prototype = {
            compileHandler: function(handler) {
                handler.addBodyParam("widget");
                handler.compile();
            }
        };
        
        return WidgetJSCompiler;
    });