

(function() {
    var global = this;
    
    if (global.console === undefined) {
        global.console = {};
    }
    
    var log = function() {
        var args = Array.prototype.slice.call(arguments);
        __rhinoHelpers.getConsole().log(args.join(", "));
    };
    
    var error = function() {
        var args = Array.prototype.slice.call(arguments);
        __rhinoHelpers.getConsole().error(args.join(", "));
    };
    
    if (console.log === undefined)
    {
        console.log = log;
    }
    
    if (console.debug === undefined)
    {
        console.debug = log;
    }
    
    if (console.info === undefined)
    {
        console.info = log;
    }

    if (console.warn === undefined)
    {
        console.warn = log;
    }

    if (console.error === undefined)
    {
        console.error = error;
    }

}());

