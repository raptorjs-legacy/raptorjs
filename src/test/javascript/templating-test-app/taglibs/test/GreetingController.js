raptor.defineClass(
    'taglibs.test.GreetingController',
    function(raptor) {

        var GreetingController = function() {
            
        };
        
        GreetingController.prototype = {
            process: function(input, context) {
                var name = input.name || "(unknown)";
                context.write("Hello " + name + "!");
            }
        };
        
        return GreetingController;
    });