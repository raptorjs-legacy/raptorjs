raptor.define(
    "components.TemplateTestbed.TemplateTestbedWidget",
    function(raptor) {
        var stringify = raptor.require('json.stringify').stringify;
        
        var TemplateTestbedWidget = function(config) {
            this.samples = config.samples;

            this.autoRender = true;
            this.compileRequired = true;
            this.dataModified = true;
            this.optionsModified = true;
            this.renderRequired = true;
            this.optionsVisible = false;
            
            this.defaultOptionsJson = stringify(raptor.require('templating.compiler').defaultOptions);
            
            this.loadSample(0);
            
            this.renderButton.subscribe('click', function(eventArgs) {
                this.update();
            }, this);
            
            
            
            this.showCompiledToggleButton.subscribe('toggle', function(eventArgs) {
                this.toggleCompiledOutput();
            }, this);
            
            this.showOptionsToggleButton.subscribe('toggle', function(eventArgs) {
                this.toggleCompilerOptions();
            }, this);
            
            this.autoRenderToggleButton.subscribe('toggle', function(eventArgs) {
                this.autoRender = !this.autoRender;
            }, this);
            
            this.templateEditor.subscribe('change', function() {
                this.compileRequired = true;
                this.renderRequired = true;
                
                if (this.autoRender) {
                    this.update();
                }
            }, this);
            
            this.dataEditor.subscribe('change', function() {
                this.dataModified = true;
                this.renderRequired = true;
                
                if (this.autoRender) {
                    this.update();
                }
            }, this);
            
            this.optionsEditor.subscribe('change', function() {
                this.optionsModified = true;
                this.compileRequired = true;
                this.renderRequired = true;
                
                if (this.autoRender) {
                    this.update();
                }
            }, this);
            
            this.samplesNav.subscribe('navItemClick', function(eventArgs) {
                var sampleIndex = $(eventArgs.el).data("sample");
                this.loadSample(sampleIndex);
            }, this);

        };
        
        TemplateTestbedWidget.prototype = {
            loadSample: function(index) {
                var sample = this.samples[index];
                
                if (!sample.templatesLoaded) {
                    raptor.forEach(sample.templates, function(template) {
                        raptor.require('templating.compiler').compileAndLoad(template.source, template.path);
                    }, this);
                    sample.templatesLoaded = true;
                }
                
                this.templateEditor.setValue(sample.template);
                this.dataEditor.setValue(sample.data);
                this.optionsEditor.setValue(sample.options || this.defaultOptionsJson);
                this.update();
            },
            
            handleEditorException: function(errorsWidget, e) {
                var errors = e.errors;
                
                if (!errors) {
                    errors = [{message: e.toString()}];
                }
                
                errorsWidget.addErrors(errors);                
            },
            
            update: function() {
                this.updateJson('compilerOptions', 'optionsModified', this.optionsEditor, this.optionsErrors);
                this.compileTemplate();
                this.updateJson('templateData', 'dataModified', this.dataEditor, this.dataErrors);
                this.renderTemplate();
            },
            
            compileTemplate: function() {
                if (!this.compilerOptions) {
                    return;
                }
                
                if (!this.compileRequired) {
                    return;
                }
                
                this.templateName = null;
                
                var templateSrc = this.templateEditor.getValue();
                var compiler = raptor.require('templating.compiler');
                
                var compiledSrc;
                
                this.templateErrors.clearErrors();
                var templateDom;
                
                try
                {
                    templateDom = raptor.require('xml.dom').createParser().parse(templateSrc);
                }
                catch(e) {
                    this.handleEditorException(this.templateErrors, "Invalid XML");
                }
                
                if (templateDom) {
                    try
                    {
                        var compilerOptions = raptor.extend({
                                defaultTemplateName: "test",
                                nameCallback: function(name) {
                                    templateName = name;
                                }
                            }, this.compilerOptions);

                        compiledSrc = compiler.compile(
                            templateDom, 
                            "test", 
                            compilerOptions);
                    }
                    catch(e) {
                        this.handleEditorException(this.templateErrors, e);
                    }
                }
                
                
                if (compiledSrc) {
                    this.compiledEditor.setValue(compiledSrc);
                    
                    raptor.require('templating').unload(templateName);

                    try
                    {
                        eval(compiledSrc);
                        this.templateName = templateName;
                    }
                    catch(e) {
                        this.handleEditorException(this.templateErrors, e);
                    }
                }
                else {
                    this.compiledEditor.setValue('');
                }
                
                this.compileRequired = false;
            },
            
            updateJson: function(targetProp, modifiedProp, editor, errors) {
                if (!this[modifiedProp]) {
                    return;
                }
                
                this[targetProp] = null;
                errors.clearErrors();
                
                var jsonData = editor.getValue();
                var data;
                
                try
                {
                    data = eval("(" + jsonData + ")");
                    this[targetProp] = data;
                }
                catch(e) {
                    this.handleEditorException(errors, e);
                }
                
                this[modifiedProp] = false;
            },
            
            renderTemplate: function() {
                if (!this.renderRequired) {
                    return;
                }
                
                if (this.templateData && this.templateName && this.compilerOptions) {
                    try
                    {
                        var output = raptor.require('templating').renderToString(this.templateName, this.templateData);
                        this.outputEditor.setValue(output);
                        this.$("#htmlViewer").html(output);
                    }
                    catch(e) {
                        this.handleEditorException(this.templateErrors, e); //TBD: ADD THIS TO THE OUTPUT ERRORS?
                        this.outputEditor.setValue('');
                        this.$("#htmlViewer").html('');
                    }
                }
                else {
                    this.outputEditor.setValue('');
                    this.$("#htmlViewer").html('');
                }
                this.renderRequired = false;
                
            },
            
            toggleCompiledOutput: function() {
                this.$("#compiledTemplateSection").toggle();
            },
            
            toggleCompilerOptions: function() {
                this.optionsVisible = !this.optionsVisible;
                
                if (this.optionsVisible) {
                    this.$("#compilerOptionsSection").removeClass("compiler-options-hidden");    
                }
                else {
                    this.$("#compilerOptionsSection").addClass("compiler-options-hidden");
                }
                
            }
        };
        
        return TemplateTestbedWidget;
    });