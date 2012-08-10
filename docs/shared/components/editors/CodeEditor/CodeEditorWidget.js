raptor.define(
    "components.editors.CodeEditor.CodeEditorWidget",
    function(raptor) {
        var CodeEditorWidget = function(config) {
            var _this = this;
            
            this.autoFormat = config.autoFormat;
            
            this.codeMirror = CodeMirror.fromTextArea(
                    this.getEl(),
                    {
                        mode: config.mode,
                        indentUnit: config.indentUnit,
                        lineNumbers: config.lineNumbers !== false,
                        readOnly: config.readOnly === true,
                        onChange: function(editor) {
                            _this.publish('change', {
                                codeEditor: _this,
                                value: editor.getValue()
                            });
                        }
                    });
            
            if (config.autoResize) {
                var wrapperEl = this.codeMirror.getWrapperElement();
                var className = wrapperEl.className;
                wrapperEl.className = className ? className + " code-editor-auto-resize" : "code-editor-auto-resize";
            }
            
            
        };
        
        CodeEditorWidget.events = ["change"];
        
        CodeEditorWidget.prototype = {
            getTextArea: function() {
                return this.codeMirror.getTextArea();
            },
            
            getValue: function() {
                return this.codeMirror.getValue();
            },
            
            setValue: function(value) {
                this.codeMirror.setValue(value);
                
                if (this.autoFormat) {
                    var startPos = this.codeMirror.posFromIndex(0);
                    var endPos = this.codeMirror.posFromIndex(value.length);
                    this.codeMirror.autoFormatRange(startPos, endPos);    
                }
                
            }
        };
        
        return CodeEditorWidget;
    });