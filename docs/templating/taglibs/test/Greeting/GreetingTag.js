raptor.defineClass(
    'taglibs.test.Greeting.GreetingTag',
    function(raptor) {
        var GreetingTag = function() {
            
        };
        
        GreetingTag.prototype = {
            process: function(input, context) {
                context.write("Hello " + input.name + "!");
            }
        };
        
        return GreetingTag;
    });