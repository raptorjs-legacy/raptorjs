raptor.define(
    "components.TemplateTestbed.TemplateTestbedTag",
    function(raptor) {
        var TemplateTestbedTag = function() {
            
        };
        
        TemplateTestbedTag.prototype = {
            process: function(input, context) {
                var widgetConfig = {};
                widgetConfig.samples = input.samples;
                
                if (input.samples && input.samples.length) {
                    input.samples[0].active = true;
                }
                
                raptor.require('templating').render('components/TemplateTestbed', {
                    widgetConfig: widgetConfig,
                    samples: input.samples
                }, context);
            }
        };
        
        return TemplateTestbedTag;
    });