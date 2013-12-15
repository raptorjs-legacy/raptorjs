/**
 * @extension  Node
 */
define.extend(
    'raptor/process',
    function(require) {
        'use strict';
        
        return {
            cwd: function() {
                return process.cwd();
            }
        };
    });