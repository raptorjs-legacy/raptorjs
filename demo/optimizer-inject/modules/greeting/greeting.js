raptor.define("greeting", function() {
    return {
        greet: function() {
            var message = "Hello from the 'greeting' module!";
            this.logger().info(message);
            return message;
        }
    };
});