/**
 * jQuery extensions applied to all widgets
 * 
 * @extension jQuery
 */
raptor.extend('widgets.Widget', function(raptor) {

    var idRegExp = /\#(\w+)( .*)?/g,
        global = raptor.global;
    
    return {
        /**
         * 
         * @param arg Selector args
         * @returns The result of the jQuery invocation
         * @see <a href="http://api.jquery.com/category/selectors/">jQuery Selectors</a>
         */
        $: function(arg) {
            var args = arguments;
            
            if (args.length === 1)
            {
                //Handle an "ondomready" callback function
                if (typeof arg === 'function') {
                    
                    var _this = this;
                    
                    $(function() {
                        arg.apply(_this, args);
                    });
                }
                else if (typeof arg === 'string') {
    
                    var match = idRegExp.exec(arg);
                    idRegExp.lastIndex = 0; //Reset the search to 0 so the next call to exec will start from the beginning for the new string
                    
                    if (match != null) {
                        var widgetElId = match[1];
                        if (match[2] == null) {
                            return $(this.getEl(widgetElId));
                        }
                        else
                        {
                            return $("#" + this.getElId(widgetElId) + match[2]);
                        }
                    }
                    else
                    {
                        var rootEl = this.getEl();
                        if (!rootEl) {
                            throw new Error('Root element is not defined for widget');
                        }
                        if (rootEl) {
                            return $(arg, rootEl);
                        }
                    }
                }
            }
            else if (args.length === 2) {
                if (typeof args[1] === 'string') {
                    return $(arg, this.getEl(args[1]));
                }
            }
            else if (args.length === 0) {
                return $(this.getEl());
            }
            
            return $.apply(global, arguments);
        },
        
        /**
         * 
         * @param callback
         * @returns
         */
        onReady: function(callback) {
            var _this = this;
            $(function() {
                callback.call(_this, _this);
            });
        }
    };
});