raptor.define(
    "components.jsdoc.Header.HeaderTag",
    function(raptor) {
        var templating = require('raptor/templating');
        
        var HeaderTag = function(config) {
            
        };
        
        HeaderTag.prototype = {
            process: function(input, context) {
                var indexUrl = raptor.require('jsdoc-util').indexUrl();

                templating.render("components/jsdoc/Header", {
                    indexUrl: indexUrl
                }, context);
            }
        };
        
        return HeaderTag;
    });