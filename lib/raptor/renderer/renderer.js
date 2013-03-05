define(
    'raptor/renderer',
    ['raptor'],
    function(raptor, require) {
        "use strict";

        var renderContext = require('raptor/render-context'),
            RenderResult = require('raptor/renderer/RenderResult');


        

        return {
            /**
             * <p>Renders a component to HTML and provides functions to allow the resulting HTML to be injected into
             * the DOM.
             * 
             * <p>
             * Usage:
             * <js>
             * var renderer = require('raptor/renderer');
             * renderer.render('ui/buttons/Button', {label: "Hello World"}).appendChild('myContainer');
             * </js>
             *
             * <p>
             * See {@link raptor/renderer/RenderResult} for supporting DOM insertion methods (including appendChild, prependChild, insertBefore, insertAfter and replace).
             * 
             * @param  {String} renderer The class/module name for the renderer (resulting object must have a "render" method or a "process" method)
             * @param  {Object} data The input data for the renderer
             * @param  {raptor/render-context/Context} context The context to use for rendering the component (optional, a new render context is created if not provided)
             * 
             * @return {raptor/renderer/RenderResult}   Returns the result of rendering the component as an instance of {@Link raptor/renderer/RenderResult}
             */
            render: function(renderer, data, context) {
                if (typeof renderer === 'string') {
                    var rendererObj = raptor.find(renderer);


                    if (!rendererObj) {
                        if (!renderer.endsWith('Renderer')) { //We'll try one naming convention for resolving a renderer name...
                            // Try converting component IDs to renderer names (e.g. 'ui/buttons/Button' --> 'ui/buttons/Button/ButtonRenderer')
                            var lastSlash = renderer.lastIndexOf('/');
                            rendererObj = raptor.find(renderer + '/' + renderer.substring(lastSlash+1) + 'Renderer');    
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

                var html,
                    doRender = function() {
                        html = renderFunc.call(renderer, data || {}, context);
                    };

                if (context) {
                    html = context.captureString(doRender) || html;
                }
                else {
                    context = renderContext.createContext();
                    doRender();
                    if (!html) {
                        html = context.getOutput();    
                    }
                }

                return new RenderResult(html, context);
            },

            /**
             * Helper function to support rendering a Raptor template.
             *
             * <p>NOTE: The code for the {@Link raptor/templating} module must already be loaded
             *
             * @since  2.2.6
             * 
             * @param  {String} templateName The name of the Raptor Template to render
             * @param  {Object} templateData The data model to pass to the template
             * @param  {raptor/render-context/Context} context The render context object to use (optional, a new render context is created if not provided)
             * @return {raptor/renderer/RenderResult}   Returns the result of rendering the component as an instance of {@Link raptor/renderer/RenderResult}
             */
            renderTemplate: function(templateName, templateData, context) {
                return this.render(
                    function(input, _context) {
                        require('raptor/templating').render(templateName, 
                                templateData, 
                                _context);
                    }, 
                    {}, 
                    context);
            }
        };
    });