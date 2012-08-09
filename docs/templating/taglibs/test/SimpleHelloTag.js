raptor.defineClass(
    'taglibs.test.SimpleHelloTag',
    function(raptor) {
        var SimpleHelloTag = function() {
            
        };
        
        SimpleHelloTag.prototype = {
            process: function(input, context) {
                var name = input.name || "(unknown)";
                context.write("Hello " + name + "! adult=" + (input.adult === true));
            }
        };
        
        return SimpleHelloTag;
    });