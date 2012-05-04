raptor.defineClass(
    'taglibs.test.TabController',
    function(raptor) {
        
        
        var TabController = function() {
            
        };
        
        TabController.prototype = {
            process: function(input, context) {
                 var tabs = input.tabs;
                 tabs.addTab(input);
            }
        };
        
        return TabController;
    });