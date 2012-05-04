/**
 * @extension jQuery
 */
raptor.extend('loader', function(raptor) {

    var extend = raptor.extend;
    
    return {
        /**
         * 
         * @param src
         * @param callback
         * @returns
         * 
         * @protected
         */
        includeJSImpl: function(src, callback) {
            var _this = this;
            
            this.logger().debug('Downloading JavaScript "' + src + '"...');
            
            $.ajax({
                url: src,
                dataType: "script",
                success: function(result) {
                    _this.logger().debug('JavaScript downloaded: "' + src + '"');
                    
                    //Let the loader module know that the resource has included successfully
                    callback.success();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    _this.logger().error('JavaScript FAILED to download: "' + src + '". Error: ' + errorThrown);
                    //Let the loader module know that the resource was failed to be included
                    callback.error();
                }
            });
        },
        
        /**
         * 
         * @param href
         * @param callback
         * @param attributes
         * @returns
         * 
         * @protected
         */
        includeCSSImpl: function(href, callback, attributes) {
            this.logger().debug('Downloading StyleSheet "' + href + '"...');

            var complete = false,
                _this = this;
            
            var el = document.createElement('link');
            
            var cleanup = function() {
                el.onload = null;
                el.onreadystatechange = null;
                el.onerror = null;
            };
            
            var success = function() {
                if (complete === false)
                {                    
                    complete = true;
                    cleanup();
                    _this.logger().debug('StyleSheet downloaded: "' + href + '"');
                    //Let the loader module know that the resource has included successfully
                    callback.success();
                }
            };
            
            var error = function() {
                this.logger().error('StyleSheet FAILED to download: "' + href + '"');
                if (complete === false)
                {                    
                    complete = true; 
                    cleanup();
                    //Let the loader module know that the resource was failed to be included
                    callback.error();
                }
            };
            
            
            extend(el, {
                type: 'text/css',
                rel: "stylesheet",
                href: href
            });
            
            if (attributes == null) {
                extend(el, attributes);
            }
            
            if (navigator.appName == 'Microsoft Internet Explorer') {
                el.onload = success;                
                el.onreadystatechange = function() {
                    var readyState = this.readyState;
                    if ("loaded" === readyState || "complete" === readyState) {
                        success();
                    }
                };
            }
            else
            {
                //For non-IE browsers we don't get the "onload" and "onreadystatechange" events...
                
                //TODO Update this code to check document.styleSheets
                success();
            }
            
            el.onerror = error;      

            $(function() {
                $("head").append(el);
            });
        }
    };
});