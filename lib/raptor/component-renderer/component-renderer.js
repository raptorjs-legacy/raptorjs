define(
    'raptor/component-renderer',
    ['raptor'],
    function(raptor, require) {
        "use strict";

        var renderContext = require('raptor/render-context'),
            RenderResult = require('raptor/component-renderer/RenderResult');


        

        return {
            /**
             * <p>Renders a component to HTML and provides functions to allow the resulting HTML to be injected into
             * the DOM.
             * 
             * <p>
             * Usage:
             * <js>
             * var renderer = require('raptor/component-renderer');
             * renderer.render('ui/buttons/Button', {label: "Hello World"}).appendChild('myContainer');
             * </js>
             *
             * <p>
             * See {@link raptor/component-renderer/RenderResult} for supporting DOM insertion methods (including appendChild, prependChild, insertBefore, insertAfter and replace).
             * 
             * @param  {String} renderer The class/module name for the renderer (resulting object must have a "render" method or a "process" method)
             * @param  {Object} data The input data for the renderer
             * @param  {raptor/render-context/Context} context The context to use for rendering the component (optional, a new render context is created if not provided)
             * 
             * @return {raptor/component-renderer/RenderResult}   Returns the resulting of rendering the component
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
                        renderFunc.call(renderer, data || {}, context);
                    };

                if (context) {
                    html = context.captureString(doRender);
                }
                else {
                    context = renderContext.createContext();
                    doRender();
                    html = context.getOutput();
                }

                return new RenderResult(html, context);
            }
        };
    });