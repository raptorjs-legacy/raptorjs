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
                    }
                    try
                    {
                        context.requestData(dependency, arg)
                            .then(
                                function(data) {

                                    try
                                    {
                                        if (input.invokeBody) {
                                            input.invokeBody(asyncContext, data);    
                                        }
                                        asyncFragment.end();
                                    }
                                    catch(e) {
                                        onError(e);
                                    }
                                },
                                function(e) {
                                    onError(e);
                                });
                    }
                    catch(e) {
                        onError(e);
                    }
                });

            }
        };
    });