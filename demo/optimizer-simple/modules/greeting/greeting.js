raptor.define("greeting", function() {
    return {
        greet: function() {
            var message = "Hello from the 'greeting' module! TEST TEST";
            this.logger().info(message);
            return message;
        }
    };
});