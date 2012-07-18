raptor.define(
    "async-module",
    function() {
        return {
            renderToEl: function(el) {
                var message = "Hello from 'async-module'!";
                var templating = raptor.require("templating");
                var html = templating.renderToString("async-module", {message: message});
                el.innerHTML = html;
            }
        };
    });