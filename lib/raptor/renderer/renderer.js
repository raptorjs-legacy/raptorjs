define('raptor/renderer', ['raptor'], function (raptor, require) {
    'use strict';
    var renderContext = require('raptor/render-context'), RenderResult = require('raptor/renderer/RenderResult');
    return {
        render: function (renderer, data, context) {
            if (typeof renderer === 'string') {
                var rendererObj = raptor.find(renderer);
                if (!rendererObj) {
                    if (!renderer.endsWith('Renderer')) {
                        //We'll try one naming convention for resolving a renderer name...
                        // Try converting component IDs to renderer names (e.g. 'ui/buttons/Button' --> 'ui/buttons/Button/ButtonRenderer')
                        var lastSlash = renderer.lastIndexOf('/');
                        rendererObj = raptor.find(renderer + '/' + renderer.substring(lastSlash + 1) + 'Renderer');
                    }
                    if (!rendererObj) {
                        throw raptor.createError(new Error('Renderer not found with name "' + renderer + '"'));
                    }
                }
                renderer = rendererObj;
            }
            var renderFunc = renderer.render || renderer.process || renderer;
            if (typeof renderFunc !== 'function') {
                throw raptor.createError(new Error('Not a valid renderer: "' + renderer + '". Renderer must be an object with "render" or "process" function or renderer must be a function.'));
            }
            var html, doRender = function () {
                    html = renderFunc.call(renderer, data || {}, context);
                };
            if (context) {
                html = context.captureString(doRender) || html;
            } else {
                context = renderContext.createContext();
                doRender();
                if (!html) {
                    html = context.getOutput();
                }
            }
            return new RenderResult(html, context);
        },
        renderTemplate: function (templateName, templateData, context) {
            return this.render(function (input, _context) {
                require('raptor/templating').render(templateName, templateData, _context);
            }, {}, context);
        }
    };
});