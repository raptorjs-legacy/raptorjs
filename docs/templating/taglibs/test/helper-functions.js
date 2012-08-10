raptor.extend('templating', function(raptor, target) {
    target.registerFunctions(
        "http://raptorjs.org/templates/test",
        "test",
        {
            upperCase: function(o) {
                return o ? o.toString().toUpperCase() : '';
            },
            classNames: function() {
                var out = [];
                for (var i=0, len=arguments.length, value; i<len; i++) {
                    value = arguments[i];
                    if (value) {
                        out.push(value);
                    }
                }
                return out.join(' ');
            }
        });
});