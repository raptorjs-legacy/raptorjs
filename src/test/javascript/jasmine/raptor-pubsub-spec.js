describe('pubsub module', function() {

    before(function() {
        createRaptor();
    });

    it('should allow basic pub sub on the global channel', function() {
        var pubsub = raptor.require('pubsub');
        
        var receivedMessage = null;
        var receivedData = null;
        var receivedTopic = false;
        
        var thisObj = {};
        pubsub.subscribe('some.topic', function(data, message) {
            expect(this).toStrictlyEqual(thisObj);
            receivedData = data;
            receivedMessage = message;
        }, thisObj);
        
        pubsub.publish('some.topic', {test: "Hello World!"});
        
        expect(receivedMessage).toNotEqual(null);
        expect(receivedData).toNotEqual(null);
        
        expect(receivedData.test).toEqual('Hello World!');
        expect(receivedMessage.getTopic()).toEqual('some.topic');
        
    });
    
    it('should allow basic pub sub on the named channels', function() {
        var pubsub = raptor.require('pubsub');
        
        var channel1 = pubsub.channel('channel1');
        var channel2 = pubsub.channel('channel2');
        
        var received1,
            received2;
        
        var thisObj = {};
        channel1.subscribe('some.topic', function(message) {
            expect(this).toStrictlyEqual(thisObj);
            received1 = message;
        }, thisObj);
        
        channel2.subscribe('some.topic', function(message) {
            expect(this).toStrictlyEqual(thisObj);
            received2 = message;
        }, thisObj);
        
        channel1.publish('some.topic', {one: "one"});
        expect(received1.one).toEqual('one');
        expect(received2).toEqual(undefined);
        
        channel2.publish('some.topic', {two: "two"});
        expect(received1.one).toEqual('one');
        expect(received2.two).toEqual('two');
        
        
    });
    
    it('should allow basic pub sub with topic wild-cards', function() {
        var pubsub = raptor.require('pubsub');
        
        var channel = pubsub.channel('channel1');
        
        var received1Messages = [],
            received2Messages = [],
            received3Messages = [];
            
        channel.subscribe('a.*', function(message) {
            received1Messages.push(message);
        });
        
        channel.subscribe('*', function(message) {
            received2Messages.push(message);
        });
        
        channel.subscribe('a.a', function(message) {
            received3Messages.push(message);
        });
        
        channel.publish('a', {value: "a"});
        channel.publish('a.a', {value: "a.a"});
        channel.publish('a.b', {value: "a.b"});
        channel.publish('a.b.c', {value: "a.b.c"});
        
        expect(received1Messages.length).toEqual(2);
        expect(received2Messages.length).toEqual(4);
        expect(received3Messages.length).toEqual(1);
        
        expect(received1Messages[0].value).toEqual('a.a');
        expect(received1Messages[1].value).toEqual('a.b');
        
        expect(received2Messages[0].value).toEqual('a');
        expect(received2Messages[1].value).toEqual('a.a');
        expect(received2Messages[2].value).toEqual('a.b');
        expect(received2Messages[3].value).toEqual('a.b.c');
        
        expect(received3Messages[0].value).toEqual('a.a');
    });
    
    it('should allow unsubscribe', function() {
        var pubsub = raptor.require('pubsub');
        
        var channel = pubsub.channel('test');
        
        var messages = [];
            
        var handle = channel.subscribe('hello', function(message) {
            messages.push(message);
        });
        
        channel.publish('hello', {one: 'one'});
        
        handle.unsubscribe();
        
        channel.publish('hello', {two: 'two'});
        
        expect(messages.length).toEqual(1);
        
        expect(messages[0].one).toEqual('one');
        
    });
    
    it('should allow the message object to be accessed after the normal arguments', function() {
        var pubsub = raptor.require('pubsub');
        var listeners = raptor.require('listeners');
        
        var channel = pubsub.channel('messageObjectTest');
        
        var receivedHello,
            receivedWorld,
            receivedMessage;
        
        channel.subscribe('test', function(data, message) {
            expect(data.hello).toEqual("Hello");
            expect(data.world).toEqual("World");
            receivedMessage = message;
        });
        
        var sentMessage = channel.publish('test', {hello: "Hello", world: "World"});
        
        expect(receivedMessage).toEqual(sentMessage);
        expect(receivedMessage.getTopic()).toEqual("test");
        expect(receivedMessage.getName()).toEqual("test");
        expect(listeners.isMessage(receivedMessage)).toEqual(true);
        
    });
    
//    it('should allow data provided by a subscriber to be passed to a callback function', function() {
//        var pubsub = raptor.require('pubsub');
//        
//        
//        var channel = pubsub.channel('subscriberData');
//        
//        channel.subscribe('test', function() {
//            
//        }, this, {sourceTest: "Hello"});
//        
//        channel.publish('test', "World");
//        
//        
//    });
    
});