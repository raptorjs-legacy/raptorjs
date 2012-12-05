/**
 * @extension  Node
 */
raptor.extend(
    'process',
    function() {
        "use strict";
        
        return {
            cwd: function() {
                return process.cwd();
            },
        };
    });