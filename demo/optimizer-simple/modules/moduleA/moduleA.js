raptor.define("moduleA", function() {
    return {
        greet: function() {
            var message = "Hello from moduleA";
            this.logger().info(message);
            return message;
        }
    };
});