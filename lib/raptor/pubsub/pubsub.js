/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Simple module to support decoupled communication using Pub/Sub communication.
 *
 * <h1>Overview</h1>
 * <p>
 * Pub/sub allows independent objects on a page to communicate by allowing publishers
 * to share information with subscribers by having subscribers publish messages
 * with a "topic name" that is agreed upon by the subscribers. The topic name
 * is simply a string value.  There are two key
 * methods for pub/sub and they are described below:
 * </p>
 *
 * <ul>
 *  <li>
 *      <b>publish(topic, props)</b><br>
 *      Publishes a message using the provided topic name. The properties in the props object, if provided, will be applied to the message that is published.
 *  </li>
 *  <li>
 *      <b>subscribe(topic, callbackFunction, thisObj)</b><br>
 *      Subscribes to messages on the provided topic.
 *      If a message is published to the provided topic then the provided callback function will be invoked. If the publisher of the message provides any argument object
 *      then argument object will be passed as arguments to the callback function (in order). In addition, the Message object will be provided after the arguments (see below).
 *  </li>
 * </ul>
 *
 * <h2>Usage:</h2>
 * <p>
 * <js>var pubsub = require('raptor/pubsub');
 * pubsub.subscribe('someTopic', function(message) {
 *     alert(message.myMessage); //Will alert "Hello World!"
 * });
 *
 * pubsub.publish('someTopic', {myMessage: 'Hello World!'});
 * </js>
 * </p>
 *
 * <h1>Private Pub/Sub Channels</h1>
 * <p>
 *
 * Pub/sub also supports private communication channels for messages. A private communication
 * channel can be obtained using <code>channel(channelName)</code> method.
 *
 * For channels to be effective, a set of publishers and subscribers would have to agree
 * on a channel name.
 * </p>
 *
 * <p>
 * <h2>Channel usage:</h2>
 * <js>var pubsub = require('raptor/pubsub');
 * var channel = pubsub.channel('myPrivateChannel');
 * channel.subscribe('someTopic', function(message) {
 *     alert(message.myMessage); //Will alert "Hello World!"
 * });
 *
 * channel.publish('someTopic', {myMessage: 'Hello World!'});
 * </js>
 * </p>
 *
 * <h1>Topics and Namespaces</h1>
 * <p>
 * A topic can be a simple topic such as "myTopic" or a namespaced topic such as "myTopic.mySubTopic". <b>Important:</b> Dots should be used to separate the topic parts.
 * The RaptorJS pubsub module supports wildcard topics when subscribing to topics.
 * </p>
 *
 * <p>
 * NOTE: The original topic can be accessed using a special message object that is passed in as the second argument to the listener function. The message data provided to the publish method will always be passed in as the first argument.
 * </p>
 *
 * <p>
 * <h2>Wildcard usage:</h2>
 * <js>var pubsub = require('raptor/pubsub');
 *
 * channel.subscribe('someTopic.*', function(data, message) {
 *     alert(data.myValue + " - " + message.getTopic());
 * });
 *
 * channel.publish('someTopic.a', {myValue: 'A'}); //Will result in alert("A - someTopic.a")
 * channel.publish('someTopic.b', {myValue: 'B'}); //Will result in alert("B - someTopic.b")
 * </js>
 * </p>
 *
 *
 */
define('raptor/pubsub', function(require, exports, module) {
    "use strict";
    
    var listeners = require('raptor/listeners');

    /**
     * The Message class allows additional information to be provided to subscribers.
     *
     * @class
     * @anonymous
     * @name raptor/pubsub/Message
     * @augments raptor/listeners/Message
     *
     * @param topic {String} The topic name of the message
     * @param props {Object} An object with properties that should be applied to the newly created message
     */
    
    var Message = define.Class({
            superclass: listeners.Message
        },
        function() {
            var Message = function(topic, props) {
                listeners.Message.call(this, topic, props);
                this.topic = topic;
            };
            
            Message.prototype = {
                /**
                 * Returns the topic name that the message was published to.
                 *
                 * @returns {String} The topic name that the message was published to
                 */
                getTopic: function() {
                    return this.topic;
                }
            };
            
            return Message;
        });
    
    /**
     * @class
     * @anonymous
     */
    var Channel = define.Class(function() {

        return {
            /**
             *
             * @param name
             * @returns
             */
            init: function(name) {
                this.name = name;
                this.observable = listeners.createObservable();
            },
            
            /**
             *
             * Publishes a Pub/Sub message to the provided topic and with the provided arguments.
             *
             * Usage:
             * <js>
             * var pubsub = require('raptor/pubsub');
             * var channel = pubsub.channel('myChannel');
             *
             * channel.publish('myTopic', {
             *     hello: "Hello",
             *     world: "World"
             * });
             *
             * </js>
             *
             * @param topic {String|raptor/pubsub/Message} The topic name or the Message object that should be published
             * @param data {Object} The data object to associate with the published message (optional)
             *
             *
             */
            publish: function(topic, data)  {
                
                var message;
                
                //Convert the arguments into a Message object if necessary so that we can associate extra information with the message being published
                if (listeners.isMessage(topic)) {
                    message = topic;
                }
                else {
                    message = require('raptor/pubsub').createMessage(topic, data);
                }
                
                this.observable.publish(message);
                
                return message;
            },
            
            /**
             * Subscribes to one or more topics on the channel.
             *
             * Two signatures are supported:
             * <ol>
             * <li> eventHandle subscribe(type, callback, thisObj, autoRemove)</li>
             * <li> eventHandle subscribe(callbacks, thisObj, autoRemove)</li>
             * </ol>
             *
             * Usage:
             * <js>var pubsub = require('raptor/pubsub');
             *
             *  //Option 1) Subscribing to a single topic
             *  pubsub.subscribe('someTopic', function(message) {
             *      //Do something when a message is received
             *  }, this);
             *
             *  //Option 2) Subscribing to a multiple topics
             *  pubsub.subscribe({
             *          'someTopic': function(message) {
             *              //Do something when a message is received
             *          },
             *          'anotherTopic': function(message) {
             *              //Do something when a message is received
             *          }
             *      }, this);
             * </js>
             *
             * @param topic {String} The topic name
             * @param callback {Function} The callback function
             * @param thisObj {Object} The "this" object to use for the callback function
             *
             * @returns {raptor/listeners/ObservableListenerHandle} A handle to remove the subscriber(s)
             */
            subscribe: function(topic, callback, thisObj) {
                return this.observable.subscribe(topic, callback, thisObj);
            }
        };
        
    });
    
    
    
    var channels = {};

    return {
        /**
         * Returns a messaging channel with the provided name. If the messaging channel has not been created then it is created and returned.
         *
         * @param name {String} The name of the messaging channel.
         *
         * @returns {raptor/pubsub/Channel} The messaging channel with the specified name.
         */
        channel: function(name) {
            var channel;
            if (name) {
                channel = channels[name];
                if (!channel) {
                    channel = new Channel(name);
                    channels[name] = channel;
                }
            } else {
                channel = new Channel();
            }
            return channel;
        },
        
        /**
         * Returns the global messaging channel.
         *
         * @returns {raptor/pubsub/Channel} The "global channel
         */
        global: function() {
            return this.channel("global");
        },
        
        /**
         *
         * Publishes a Pub/Sub message to the provided topic and with the provided arguments to the "global" channel.
         *
         * Usage:
         * <js>
         * var pubsub = require('raptor/pubsub');
         *
         * pubsub.publish('myTopic', {
         *     hello: "Hello",
         *     world: "World"
         * });
         *
         * </js>
         *
         * NOTE: Calling this method is equivalent to the following code:
         * <js>pubsub.global().publish(topic, props)</js>
         *
         * @param topic {String|raptor/pubsub/Message} The topic name or the Message object that should be published
         * @param props {Object} An object with properties that should be applied to the message object (optional)
         *
         *
         */
        publish: function(topic, props) {
            var global = this.global();
            global.publish.apply(global, arguments);
        },
        
        /**
         * Subscribes to one or more topics on the "global" channel.
         *
         * Two signatures are supported:
         * <ol>
         * <li> eventHandle subscribe(type, callback, thisObj, autoRemove)</li>
         * <li> eventHandle subscribe(callbacks, thisObj, autoRemove)</li>
         * </ol>
         *
         * Usage:
         * <js>var pubsub = require('raptor/pubsub');
         *
         *  //Option 1) Subscribing to a single topic
         *  pubsub.subscribe('someTopic', function(message) {
         *      //Do something when a message is received
         *  }, this);
         *
         *  //Option 2) Subscribing to a multiple topics
         *  pubsub.subscribe({
         *          'someTopic': function(message) {
         *              //Do something when a message is received
         *          },
         *          'anotherTopic': function(message) {
         *              //Do something when a message is received
         *          }
         *      }, this);
         * </js>
         *
         * NOTE: Calling this method is equivalent to the following code:
         * <js>pubsub.global().subscribe(topic, callback, thisObj)</js>
         *
         * @param topic {String} The topic name
         * @param callback {Function} The callback function
         * @param thisObj {Object} The "this" object to use for the callback function
         *
         * @returns {raptor/listeners/ObservableListenerHandle} A handle to remove the subscriber(s)
         *
         * @see {@link raptor/pubsub/Channel#subscribe}
         */
        subscribe: function(topic, callback, thisObj) {
            var global = this.global();
            return global.subscribe.apply(global, arguments);
        },
        
        /**
         * Returns a new {@Link raptor/pubsub/Message} object with the provided topic and properties applied.
         *
         * @param topic {String} The topic name
         * @param props {Object} Properties to apply to the newly created Message object (optional)
         * @returns {raptor/pubsub/Message} The newly created Message object.
         */
        createMessage: function(topic, data) {
            return new Message(topic, data);
        }
    };
});