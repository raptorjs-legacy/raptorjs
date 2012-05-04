raptor.defineClass(
    'taglibs.test.SimpleHelloController',
    function(raptor) {
        var SimpleHelloController = function() {
            
        };
        
        SimpleHelloController.prototype = {
            process: function(input, context) {
                var name = input.name || "(unknown)";
                context.write("Hello " + name + "! adult=" + (input.adult === true));
            }
        };
        
        return SimpleHelloController;
    });