require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe('listeners module', function() {

    it('should allow listener groups', function() {
        
        var listeners = require('raptor/listeners').createObservable();
        
        var thisObj = {};
        var testEventFired = false;
        listeners.subscribe('testEvent', function(eventArgs) {
            expect(eventArgs.one).toEqual(1);
            expect(eventArgs.two).toEqual(2);
            testEventFired = true;
        }, thisObj);
        
        listeners.publish('testEvent', {
            one: 1, 
            two: 2
        });
        
        expect(testEventFired).toEqual(true);
     });
    
    it('should allow multiple types for ListenerGroup.subscribe()', function() {
        
        var listeners = require('raptor/listeners').createObservable();
        
        var event1Fired = false,
            event2Fired = false;
        
        listeners.subscribe({
            'event1': function(eventArgs) {
                expect(eventArgs.one).toEqual(1);
                expect(eventArgs.two).toEqual(2);
                event1Fired = true;
            },
            'event2': function(eventArgs) {
                expect(eventArgs.three).toEqual(3);
                expect(eventArgs.four).toEqual(4);
                event2Fired = true;
            }
        });
        
        listeners.publish('event1', {one: 1, two: 2});
        listeners.publish('event2', {three: 3, four: 4});
        
        expect(event1Fired).toEqual(true);
        expect(event2Fired).toEqual(true);
     });
    
    it('should allow a custom thisObj to be used for callbacks with listener groups', function() {
        
        var listeners = require('raptor/listeners').createObservable();
        
        var thisObj = {};
        listeners.subscribe('testEvent', function() {
            expect(this).toStrictlyEqual(thisObj);
        }, thisObj);
        
        var anotherThisObj = {};
        
        listeners.subscribe({
            'event1': function() {
                expect(this).toEqual(anotherThisObj);
            },
            'event2': function() {
                expect(this).toEqual(anotherThisObj);
            }
        }, anotherThisObj);
       
        listeners.publish('testEvent');
        listeners.publish('event1');
        listeners.publish('event2');
        
     });
    
    it('should allow listeners to be removed', function() {
        
        var listeners = require('raptor/listeners').createObservable();
        
        var event1Fired = false,
            event2Fired = false;
            event3Fired = false;
            event4Fired = false;
            event5Fired = false;
            event6Fired = false;
        
        var handle_1_2 = listeners.subscribe({
            'event1': function() {
                event1Fired = true;
            },
            'event2': function() {
                event2Fired = true;
            }
        });
        
        var handle_3_4_5 = listeners.subscribe({
            'event3': function() {
                event3Fired = true;
            },
            'event4': function() {
                event4Fired = true;
            },
            'event5': function() {
                event5Fired = true;
            }
        });
        
        var handle_6 = listeners.subscribe('event6', function() {
            event6Fired = false;
        }, this);
        
        handle_1_2.removeAll();
        handle_3_4_5.remove('event3');
        handle_3_4_5.remove('event4');
        //keep event5 callback
        handle_6.remove();
        
        listeners.publish('event1');
        listeners.publish('event2');
        listeners.publish('event3');
        listeners.publish('event4');
        listeners.publish('event5');
        listeners.publish('event6');
        
        expect(event1Fired).toEqual(false);
        expect(event2Fired).toEqual(false);
        expect(event3Fired).toEqual(false);
        expect(event4Fired).toEqual(false);
        expect(event5Fired).toEqual(true);
        expect(event6Fired).toEqual(false);
        
        
     });
    
    it('should allow any object become a listener', function() {
        var myObject = {};
        require('raptor/listeners').makeObservable(myObject);
        
        var thisObj = {};
        
        var testFired = false;
        
        myObject.subscribe('test', function() {
            expect(this).toStrictlyEqual(thisObj);
            testFired = true;
        }, thisObj);
        
        myObject.publish('test');
        
        expect(testFired).toEqual(true);
        
        var anotherObject = {};
        
        require('raptor/listeners').makeObservable(anotherObject);
        
        var event1Fired = false,
            event2Fired = false;
        
        anotherObject.subscribe({
            'event1': function() {
                event1Fired = true;
            },
            'event2': function() {
                event2Fired = true;
            }
        });

        anotherObject.publish('event1');        
        expect(event1Fired).toEqual(true);
        expect(event2Fired).toEqual(false);
        
        anotherObject.publish('event2');  
        expect(event2Fired).toEqual(true);
    });
    
    it('should allow the original message name to be accessed', function() {
        
        var observable = require('raptor/listeners').createObservable();
        
        var receivedMessage;
        
        observable.subscribe('test', function(data, message) {
            receivedMessage = message;
        });
        
        observable.publish('test');
        
        expect(receivedMessage).toNotEqual(null);
        expect(receivedMessage.getName()).toEqual("test");
        
    });
    
    it('should allow an args array to be provided to the publish method', function() {
        
        var observable = require('raptor/listeners').createObservable();
        
        var receivedHello,
            receivedWorld,
            messageReceived = false;
        
        observable.subscribe('test', function(hello, world) {
            expect(hello).toEqual("hello");
            expect(world).toEqual("world");
            messageReceived = true;
        });
        
        observable.publish('test', ['hello', 'world']);
        
        
        expect(messageReceived).toEqual(true);
        
        
    });
    
    it('should allow messages to be restricted for observables', function() {
        var observable = require('raptor/listeners').createObservable();
        observable.registerMessages([]);
        
        
        var test1Count = 0;
        var test2Count = 0;
        
        var _e = null;
        
        try
        {
            observable.subscribe('test1', function() {
                test1Count++;
            });
            
            observable.subscribe('test2', function() {
                test2Count++;
            });
        }
        catch(e) {
            _e = e;
        }
        expect(_e).toNotEqual(null);
        
        
        _e = null;
        try
        {
            observable.publish('test1');
        }
        catch(e) {
            _e = e;
        }
        expect(_e).toNotEqual(null);
        
        _e = null;
        try
        {
            observable.publish('test2');
        }
        catch(e) {
            _e = e;
        }
        expect(_e).toNotEqual(null);
        
        observable.registerMessages(['test1', 'test2']);
        
        observable.subscribe('test1', function() {
            test1Count++;
        });
        
        observable.subscribe('test2', function() {
            test2Count++;
        });
        
        observable.publish('test1');
        observable.publish('test2');
        
        expect(test1Count).toEqual(1);
        expect(test2Count).toEqual(1);
        
    });

    it('should allow message functions to be added for allowed messages', function() {
        var observable = require('raptor/listeners').createObservable();
        observable.registerMessages(['test1', 'test2'], true /* create functions */);
        
        
        var test1Count = 0;
        var test2Count = 0;
        
        observable.subscribe('test1', function(message) {
            test1Count += message.inc;
        });
        
        observable.subscribe('test2', function(message) {
            test2Count += message.inc;
        });
        
        observable.test1(function(message) {
            test1Count += message.inc;
        });
        
        observable.test2(function(message) {
            test2Count += message.inc;
        });
        
        observable.test1({inc: 1});
        observable.test2({inc: 1});
        
        expect(test1Count).toEqual(2);
        expect(test2Count).toEqual(2);
        
    });
    
    it('should allow the set of allowed messages and option to create functions to be passed in at creation time', function() {
        var observable = require('raptor/listeners').createObservable(['test1', 'test2'], true /* create functions */);
        
        var test1Count = 0;
        var test2Count = 0;
        
        observable.subscribe('test1', function(message) {
            test1Count += message.inc;
        });
        
        observable.subscribe('test2', function(message) {
            test2Count += message.inc;
        });
        
        
        observable.test1({inc: 1});
        observable.test2({inc: 1});
        
        expect(test1Count).toEqual(1);
        expect(test2Count).toEqual(1);
        
        var _e = null;
        
        try
        {
            observable.subscribe('test3', function() {});
        }
        catch(e) {
            _e = e;
        }
        expect(_e).toNotEqual(null);
        
        _e = null;
        
        try
        {
            observable.publish('test3');
        }
        catch(e) {
            _e = e;
        }
        expect(_e).toNotEqual(null);
    });
    
    it('should allow a function to be observable', function() {
        var f = function() {
            f.success({result: "Hello World!"});
        };
        
        require('raptor/listeners').makeObservable(f, null, ['success', 'error'], true /* create functions */);
        
        var result = null;
        
        f.success(function(message) {
            result = message.result;
        });
        
        f();
        
        expect(result).toEqual('Hello World!');
    });
    
    it('should allow an object to unsubscribe from everything', function() {
        var publisher1 = require('raptor/listeners').createObservable();
        var publisher2 = require('raptor/listeners').createObservable();
        var publisher3 = require('raptor/listeners').createObservable();
        
        var subscriber = {};
        
        var p1Count = 0,
            p2Count = 0,
            p3Count = 0;
        
        publisher1.subscribe('test1', function() {
            p1Count++;
        }, subscriber);
        
        publisher2.subscribe('test2', function() {
            p2Count++;
        }, subscriber);
        
        var p3Handle = publisher3.subscribe('test3', function() {
            p3Count++;
        }, subscriber);
        
        publisher1.publish('test1');
        publisher2.publish('test2');
        publisher3.publish('test3');
        
        expect(p1Count).toEqual(1);
        expect(p2Count).toEqual(1);
        expect(p3Count).toEqual(1);
        
        p3Handle.unsubscribe();
        
        require('raptor/listeners').unsubscribeFromAll(subscriber);
        
        publisher1.publish('test1');
        publisher2.publish('test2');
        publisher3.publish('test3');
        
        expect(p1Count).toEqual(1);
        expect(p2Count).toEqual(1);
        expect(p3Count).toEqual(1);
    });
});