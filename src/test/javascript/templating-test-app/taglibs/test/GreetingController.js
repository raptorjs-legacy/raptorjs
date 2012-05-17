raptor.defineClass(
    'taglibs.test.GreetingController',
    function(raptor) {
        var templating = raptor.require("templating");
        
        var GreetingController = function() {
            
        };
        
        GreetingController.prototype = {
            process: function(input, context) {
                var name = input.name;
                
                templating.render("test/Greeting", {
                    name: name
                }, context);
            }
        };
        
        return GreetingController;
    });