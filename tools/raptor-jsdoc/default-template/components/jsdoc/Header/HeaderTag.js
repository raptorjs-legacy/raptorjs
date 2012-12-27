define(
    "components.jsdoc.Header.HeaderTag",
    ['raptor'],
    function(raptor, require) {
        var templating = require('raptor/templating');
        
        var HeaderTag = function(config) {
            
        };
        
        HeaderTag.prototype = {
            process: function(input, context) {
                var indexUrl = require('jsdoc-util').indexUrl();

                templating.render("components/jsdoc/Header", {
                    indexUrl: indexUrl
                }, context);
            }
        };
        
        return HeaderTag;
    });