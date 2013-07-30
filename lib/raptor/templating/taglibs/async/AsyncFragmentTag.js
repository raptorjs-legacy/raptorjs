define(
    'raptor/templating/taglibs/async/AsyncFragmentTag',
    function(require, exports, module) {
        "use strict";

        var logger = module.logger();
        
        return {
            render: function(input, context) {
                var dependency = input.dependency,
                    arg = input.arg || {};

                arg.context = context;
                
                context.beginAsyncFragment(function(asyncContext, asyncFragment) {
                    var onError = function(e) {
                        logger.error('An error has occurred: ' + e, e);
                        asyncFragment.end();
                    };

                    function renderBody(data) {
                        try {
                            if (input.invokeBody) {
                                input.invokeBody(asyncContext, data);    
                            }
                            asyncFragment.end();
                        }
                        catch(e) {
                            onError(e);
                        }
                    }

                    try {
                        var promise = context.requestData(dependency, arg);
                        if (promise.resolvedValue) {
                            renderBody(promise.resolvedValue);
                        }
                        else {
                            promise
                                .then(
                                    function(data) {
                                        renderBody(data);
                                    },
                                    function(e) {
                                        onError(e);
                                    });
                        }
                    }
                    catch(e) {
                        onError(e);
                    }
                });

            }
        };
    });