raptor.define("greeting", function() {
    return {
        renderToEl: function(el) {
            var message = "Hello from 'greeting'!";
            var templating = raptor.require("templating");
            var html = templating.renderToString("greeting", {message: message});
            el.innerHTML = html;
        }
    };
});