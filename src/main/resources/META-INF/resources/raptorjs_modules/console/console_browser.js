$rload(function(raptor) {
    if (!window.console)
    {
        var console = {};
        window.console = console;
        
        var logFunction = window.opera ? 
                function() { window.opera.postError(arguments); } : 
                function() {};
                
        raptor.forEach(
                ['log', 
                 'debug', 
                 'info', 
                 'warn', 
                 'error', 
                 'assert', 
                 'dir', 
                 'dirxml', 
                 'group', 
                 'groupEnd',
                 'time', 
                 'timeEnd', 
                 'count', 
                 'trace', 
                 'profile', 
                 'profileEnd'],
             function(name) {
                    console[name] = logFunction;
             });
    }
});
