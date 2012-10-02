/**
 * @extension  Node
 */
raptor.extend(
    'process',
    function() {
        return {
            cwd: function() {
                return process.cwd();
            },
        }
    })