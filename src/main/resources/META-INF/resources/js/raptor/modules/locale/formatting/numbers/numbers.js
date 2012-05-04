raptor.defineModule('locale.formatting.numbers', function() {
    
    /**
     * @class
     * @name locale.formatting.numbers-NumberFormatter
     * @anonymous
     */
    var NumberFormatter = function(sep) {
        this.sub = '$1' + sep + '$2$3';
        this.exp = new RegExp('(\\d)(\\d{3})(' + ((sep == '.')?'\\.':sep) + '|$)');
    };

    NumberFormatter.prototype = {

        /**
         * 
         * @param num {number} The number to be formatted
         * @returns {String} The formatted number
         */
        format : function(num) {
            var self = this,
                exp = self.exp,
                sub = self.sub;
            
            num = num + '';
                
            while (exp.test(num)) {
                num = num.replace(exp,sub);
            }
            return num;
        }
    };
    
    return {
        /**
         * 
         * @param config
         * @returns {locale.formatting.numbers-NumberFormatter} The NumberFormatter instance based on the formatter configuration
         */
        createFormatter: function(config) {
            config = config || {};
            var groupSeparator = config.groupSeparator || ',';
            return new NumberFormatter(groupSeparator);
        } 
    };
});