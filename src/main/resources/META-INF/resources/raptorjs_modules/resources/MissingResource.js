raptorBuilder.addLoader(function(raptor) {
    raptor.defineClass(
        'resources.MissingResource', 
        {
            superclass: 'resources.Resource'
        },
        function() {

            var MissingResource = function(path) {
                MissingResource.superclass.constructor.call(this, path);
            };
            
            MissingResource.prototype = {
                /**
                 * 
                 * @returns {Boolean} Always returns false
                 */
                exists: function() {
                    return false;
                }
            };
            
            return MissingResource;
        });
});