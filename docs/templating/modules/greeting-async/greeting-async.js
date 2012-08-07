raptor.define(
    "greeting-async",
    function() {
        return {
            renderToEl: function(el) {
                var message = "Hello from 'greeting-async'!";
                var templating = raptor.require("templating");
                var html = templating.renderToString("greeting-async", {message: message});
                el.innerHTML = html;
            }
        };
    });