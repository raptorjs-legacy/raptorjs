raptor.defineClass(
    "templating.taglibs.widgets.WidgetsTagTransformer",
    function(raptor) {
        var widgetsNS = "http://ebay.com/raptor/widgets";
        
        return {
            process: function(node, compiler, template) {
                
                var id;
                
                if ((id = node.getPropertyNS(widgetsNS, "id")) != null) {
                    
                    
                    var widgetsData = template.attributes[widgetsNS];
                    if (!widgetsData) {
                        widgetsData = template.attributes[widgetsNS] = {};
                    }
                    
                    if (!widgetsData.docVarAdded) {
                        template.addRenderJavaScriptVar("widgetDoc", "context.widgetDoc()");
                        widgetsData.docVarAdded = true;
                    }
                    
                    node.setPropertyNS(widgetsNS, "doc", template.makeExpression("widgetDoc"));
                }
            }
        };
    });