raptor.define(
    "components.editors.CodeEditor.CodeEditorTag",
    function(raptor) {
        var CodeEditorTag = function() {
            
        };
        
        CodeEditorTag.prototype = {
            process: function(input, context) {
                var widgetConfig = {},
                    rootAttrs = {},
                    classNames = [];
                
                if (input.mode) {
                    widgetConfig.mode = input.mode;
                }
                if (input.autoResize === true) {
                    widgetConfig.autoResize = true;
                    
                }
                if (classNames.length) {
                    rootAttrs["class"] = classNames.join(" ");    
                }
                if (input.readOnly === true) {
                    widgetConfig.readOnly = true;
                }
                
                if (input.autoFormat) {
                    widgetConfig.autoFormat = true;
                }
                
                if (input.name) {
                    rootAttrs.name = input.name;
                }
                
                if (input.lineNumbers === false) {
                    widgetConfig.lineNumbers = false;
                }
                
                if (input.indentUnit) {
                    widgetConfig.indentUnit = input.indentUnit;
                }
                    
                raptor.require('templating').render('components/editors/CodeEditor', {
                    tag: input, 
                    widgetConfig: widgetConfig,
                    widgetContext: input.widgetContext,
                    rootAttrs: rootAttrs
                }, context);
            }
        };
        
        return CodeEditorTag;
    });