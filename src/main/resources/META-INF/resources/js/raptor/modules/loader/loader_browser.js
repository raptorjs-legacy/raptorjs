/**
 * @extension Browser
 */
raptor.extend('loader', function(raptor) {
    
    return {
        
        handle_js: function(include, transaction) {
            var url = include.src || include.url || include;
            transaction._add(url, include, this.includeJSImpl, this);
        },
        
        handle_css: function(include, transaction) {
            var url = include.href || include.url || include;
            transaction._add(url, include, this.includeCSSImpl, this);
        },
        
        /**
         * 
         * @param src
         * @param callback
         * @param thisObj
         * @returns
         */
        includeJS: function(src, callback, thisObj) {
            return this.include({js: [src]}, callback, thisObj);
        },
        
        /**
         * 
         * @param href
         * @param callback
         * @param thisObj
         * @returns
         */
        includeCSS: function(href, callback, thisObj) {
            return this.include({css: [href]}, callback, thisObj);
        }
        
    };
});