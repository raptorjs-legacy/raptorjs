define(
    'raptor/templating/taglibs/caching/CachedFragmentTag',
    function(require) {
        
        return {
            render: function(input, context) {
                var attributes = context.getAttributes(),
                    cacheProvider = attributes.cacheProvider,
                    cache,
                    cachedHtml;
                if (!cacheProvider) {
                    cacheProvider = require('raptor/caching').getDefaultProvider();
                }
                
                cache = cacheProvider.getCache(input.cacheName);
                cachedHtml = cache.get(input.cacheKey, function() {
                    return context.captureString(function() {
                        if (input.invokeBody) {
                            input.invokeBody();
                        }
                    });

                });
                
                context.write(cachedHtml);
            }
        };
    });