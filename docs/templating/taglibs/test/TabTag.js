raptor.defineClass(
    'taglibs.test.TabTag',
    function(raptor) {
        
        
        var TabTag = function() {
            
        };
        
        TabTag.prototype = {
            process: function(input, context) {
                 var tabs = input.tabs;
                 tabs.addTab(input);
            }
        };
        
        return TabTag;
    });