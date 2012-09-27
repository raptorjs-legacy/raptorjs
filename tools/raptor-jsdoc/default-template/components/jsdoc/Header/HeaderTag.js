raptor.define(
    "components.jsdoc.Header.HeaderTag",
    function(raptor) {
        var templating = raptor.require('templating');
        
        var HeaderTag = function(config) {
            
        };
        
        HeaderTag.prototype = {
            process: function(input, context) {
                templating.render("components/jsdoc/Header", {
                }, context);
            }
        };
        
        return HeaderTag;
    });