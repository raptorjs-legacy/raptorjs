define(
    'raptor/component-renderer',
    ['raptor'],
    function(raptor, require) {
        var renderContext = require('raptor/render-context'),
            methods = {
                appendChild: function(targetEl, docFragment) {
                    targetEl.appendChild(docFragment);
                },
                replace: function(targetEl, docFragment) {
                    var pubsub = require('raptor/pubsub');
                    if (pubsub) {
                        pubsub.publish('dom/beforeRemove', { 
                            el: targetEl
                        }); // NOTE: Give other modules a chance to gracefully cleanup after removing the old node
                    }
                    targetEl.parentNode.replaceChild(docFragment, targetEl);
                }, 
                insertBefore: function(targetEl, docFragment) {
                    targetEl.parentNode.insertBefore(docFragment, targetEl)
                }, 
                insertAfter: function(targetEl, docFragment) {
                    var nextSibling = targetEl.nextSibling,
                        parentNode = targetEl.parentNode;

                    if (nextSibling) {
                        targetEl.parentNode.insertBefore(docFragment, nextSibling);
                    }
                    else {
                        targetEl.parentNode.appendChild(docFragment);
                    }
                }, 
                prependChild: function(targetEl, docFragment) {
                    targetEl.insertBefore(docFragment, targetEl.firstChild || null)
                }
            };

        return {
            methods: methods,

            render: function(renderer, config) {
                if (!config) {
                    config = {};
                }
                var el = config.el,
                    method = methods[config.method || 'appendChild'];

                if (typeof el === 'string') {
                    el = document.getElementById(el);
                }

                if (typeof renderer === 'string') {
                    var rendererObj = raptor.find(renderer);
                    if (!rendererObj) {
                        throw raptor.createError(new Error('Renderer not found with name "' + renderer + '"'));
                    }
                    renderer = rendererObj;
                }
                
                var renderFunc = renderer.process || renderer.render;
                if (!renderFunc) {
                    throw raptor.createError(new Error('"render" function not found in "' + renderer + '"'));
                }

                var context = renderContext.createContext(),
                    html;

                renderFunc.call(renderer, config.input || {}, context);

                if (el) {
                    var html = context.getOutput(),
                        docFragment = document.createDocumentFragment(),
                        newBodyEl = document.createElement('body'),
                        curEl;

                    newBodyEl.innerHTML = html;

                    while(curEl=newBodyEl.firstChild) {
                        docFragment.appendChild(curEl);
                    }

                    method.call(methods, el, docFragment);
                    var pubsub = require('raptor/pubsub');
                    if (pubsub) {
                        pubsub.publish('raptor/component-renderer/renderedToDOM', { 
                            context: context,
                            el: el
                        }); // NOTE: This will trigger widgets to be initialized if there were any    
                    }
                    
                }
                else {
                    return context;
                }
            }
        };
    });