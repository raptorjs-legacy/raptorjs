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

$rload(function(raptor) {
    "use strict";
    
    var forEach = raptor.forEach,
        forEachEntry = raptor.forEachEntry,
        arrayFromArguments = raptor.arrayFromArguments,
        isArray = raptor.isArray,
        extend = raptor.extend,
        nextHandleId = 0,
        handlesPropName = "__lstnrs",
        EMPTY_FUNC = function() {},
        listeners,
        _bind = function(callbackFunc, thisObj) {
            if (!callbackFunc) return EMPTY_FUNC;
            if (!thisObj) return callbackFunc;
            return function() {
                callbackFunc.apply(thisObj, arguments);
            };
        },
        _removeListener = function(listeners, listener) {
            var newListeners = [],
                thisObj;
            
            listener.removed = true;
            
            forEach(listeners._listeners, function(curListener) {
                
                if (curListener !== listener && !curListener.removed) {
                    newListeners.push(curListener);
                }
            });
            
            listeners._listeners = newListeners;
            
            if ((thisObj = listener.thisObj)) {
                delete thisObj[handlesPropName][listener.id];
            }
            
            if (!listeners._listeners.length) {
                listeners._onEmpty();
            }
        },
        _createRemoveListenerFunc = function(listeners, listener) {
            return function() {
                _removeListener(listeners, listener);
            };
        },
        _createRemoveObservableFunc = function(handles) {
            return function(name) {
                if (!arguments.length) {
                    forEachEntry(handles, function(name, h) {
                        h.remove();
                    });
                }
                else
                {
                    var handle = handles[name];
                    if (!handle) {
                        throw raptor.createError(new Error('Invalid message name: ' + name));
                    }
                    handle.unsubscribe();
                }
            };
        };
        
    /**
     * The Message class allows additional information to be provided to subscribers.
     * 
     * @class
     * @anonymous
     * @name listeners.Message
     * 
     * @param name {String} The name of the message
     * @param props {Object} An object with properties that should be applied to the newly created message 
     */
    var Message = function(name, data) {
        this.name = name;
        this.data = data;
    };
    
    Message.prototype = /** @lends listeners.Message.prototype */ {
        /**
         * Return the message name.
         * 
         * @returns {String} The name of the message
         */
        getName: function() {
            return this.name;
        },
        
        /**
         * Return the message data.
         * 
         * @returns {Object} The data for the message
         */
        getData: function() {
            return this.data;
        }
    };
    
    /**
     * @name listeners.Listeners
     * @anonymous
     * @class
     */
    var Listeners = function() {
        this._listeners = [];
        this._onEmpty = EMPTY_FUNC;
    };
    
    Listeners.prototype = /** @lends listeners-Listeners.prototype */ {
        /**
         * 
         * @param callback
         * @param thisObj
         * @param autoRemove
         * @returns {listeners.ListenerHandle} A listener handle
         */
        add: function(callback, thisObj, autoRemove) {
            var listener = {
                    callback: callback,
                    thisObj: thisObj,
                    removed: false,
                    autoRemove: autoRemove,
                    id: nextHandleId++
                },
                handles,
                _this = this;
            
            
            
            _this._listeners.push(listener);
                        
            /**
             * @name listeners.ListenerHandle
             */
            var handle = {
                /**
                 * @returns {void}
                 */
                remove: _createRemoveListenerFunc(_this, listener)
                
                /**
                 * Removes the added listener
                 * 
                 * @function
                 * @memberOf listeners-ListenerHandle.prototype
                 * @name unsubscribe
                 * 
                 * 
                 */
            };
            
            /**
             * Removed the added listener. Deprecated.
             */
            handle.unsubscribe = handle.remove;
            
            if (thisObj) {
                
                if (!(handles = thisObj[handlesPropName])) {
                    handles = thisObj[handlesPropName] = {};
                }
                handles[listener.id] = handle;
            }

            return handle;
            
        },
        
        
        
        /**
         * Publishes a message to the listeners in this list
         * @param args
         */
        publish: function() {
            var args = arguments,
                _this = this;
            
            forEach(_this._listeners, function(listener) {
                if (listener.removed) return;
                
                listener.callback.apply(listener.thisObj, args);
                
                if (listener.autoRemove)
                {
                    _removeListener(_this, listener);
                }
            });
        },
        
        /**
         * 
         * @param callback
         * @param thisObj
         */
        onEmpty: function(callback, thisObj) {
            this._onEmpty = _bind(callback, thisObj);
        }
    };
    
    var checkMessage = function(messageName, observable) {
        var allowedMessages = observable._allowed;
        if (allowedMessages && !allowedMessages[messageName]) {
            throw new Error('Invalid message name of "' + messageName + '". Allowed messages: ' + raptor.keys(allowedMessages).join(', '));
        }
        
    };
    
    
    var _createMessageFunc = function(name) {
        return function(props) {
            var args = [name].concat(arrayFromArguments(arguments));
            this[typeof props == 'function' ? 'subscribe' : 'publish'].apply(this, args);
        };
    };
    
    /**
     * @class
     * @anonymous
     * @name listeners.Observable
     */
    var Observable = function() {
        this._byName = {};
    };
    
    Observable.prototype = /**@lends listeners.Observable.prototype */ {
        __observable: true,
        
        /**
         * @param events {Array.<String>} An array of event names to register
         * @param createPublishFunctions
         */
        registerMessages: function(messages, createPublishFunctions) {
            if (!this._allowed) {
                this._allowed = {};
            }
            
            for (var i=0, len=messages.length; i<len; i++) {
                var message = messages[i];
                this._allowed[message] = true;
                
                if (createPublishFunctions) {
                    this[message] = _createMessageFunc(message);
                }
            }
            
        },
        
        
        /**
         * Registers a listener or a set of listeners for the provided event types.
         * 
         * Two signatures are supported:
         * <ol>
         * <li> eventHandle subscribe(type, callback, thisObj, autoRemove)</li>
         * <li> eventHandle subscribe(callbacks, thisObj, autoRemove)</li>
         * </ol>
         * 
         * @param name {String} The message name
         * @param callback {Function} The callback function
         * @param thisObj
         * @param autoRemove
         * @returns {listeners.ObservableListenerHandle} A handle to remove the added listeners or select listeners
         */
        subscribe: function(name, callback, thisObj, autoRemove) {
            var _this = this,
                handles,
                handle;
            
            if (typeof name == 'object')
            {
                autoRemove = thisObj; //autoRemove is the third argument
                thisObj = callback; //thisObj is the second argument
                
                handles = {};
                
                forEachEntry(name, function(name, callback) {
                    handles[name] = _this.subscribe(name, callback, thisObj, autoRemove);
                    
                });
                
                /**
                 * @class
                 * @anonymous
                 * @name listeners.ObservableListenerHandle
                 */
                handle = {
                    
                    /**
                     * @function
                     * @param {string} name The message name to unsubscribe from (optional, if not specified then the listeners for all messages will be removed)
                     * @returns
                     */
                    unsubscribe: _createRemoveObservableFunc(handles)
                    
                    /**
                     * @function
                     * @name remove
                     * @memberOf listeners.ObservableListenerHandle.prototype
                     * 
                     * @param type
                     * @returns
                     * 
                     * @deprecated
                     */
                    
                    /**
                     * Removes all subscribers for all message types
                     * @function
                     * @name removeAll
                     * @memberOf listeners.ObservableListenerHandle.prototype
                     * @returns
                     * @deprecated
                     */
                };
                
                handle.remove = handle.removeAll = handle.unsubscribe;
                
                return handle;
            }
            
            checkMessage(name, _this);
            
            var listenersInstance = _this._byName[name];
            if (!listenersInstance)
            {
                _this._byName[name] = listenersInstance = new Listeners();
                
                
                //Prevent a memory leak by removing empty listener lists
                listenersInstance.onEmpty(function() {
                    delete _this._byName[name];
                });
            }
            return listenersInstance.add(callback, thisObj, autoRemove);
        },
        
        /**
         * Publishes a message with the specified name.
         * 
         * Arguments can be passed to the subscribers by providing zero or more arguments after the topic name argument
         * 
         * Example code:
         * <js>
         * //Simple string as argument
         * someObj.publish('myMessage', 'Hello World!');
         * 
         * //Multiple arguments
         * someObj.publish('myMessage', 'Hello World!', 'John Doe');
         * </js>
         * 
         * @param name {String|listeners.Message} The message name or a Message object that has the message name and args as properties.
         * @param props {Object|Array} Properties to apply to the published message object
         */
        publish: function(name, message) {
            
            var args;
            
            if (isArray(message)) {
                args = message;
            }
            else {
                if (listeners.isMessage(name)) {
                    message = name;
                    name = message.getName();
                }
                else {
                    message = listeners.createMessage(name, message);
                }
                args = [message.data, message];
            }
            
            
            checkMessage(name, this);
           
            var _this = this;
            
            var _publish = function(name) {
                var listenersInstance = _this._byName[name];
                if (!listenersInstance) return;
                
                listenersInstance.publish.apply(listenersInstance, args);
            };
            
            _publish(name);
            _publish('*');
            
            var lastDot = name.lastIndexOf('.');
            if (lastDot >= 0)
            {
                _publish(name.substring(0, lastDot+1) + '*');
            }
            
            return message;
        }
    };
    /**
     * @namespace
     * @raptor
     * @name listeners
     */
    return (raptor.listeners = listeners = {
        /**
         * @type listeners.Message
         * 
         */
        Message: Message,
        
        /**
         * Creates a new listener list and returns it.
         * 
         * @returns {listeners-Listeners} The newly created {@link listeners-Listeners} object.
         */
        createListeners: function() {
            return new Listeners();
        },
        
        /**
         * Creates a new observable object and returns it.
         * 
         * @param allowedMessages {Array<String>} An array of messages that are allowed (more can be added later using {@Link .registerMessages}). Optional
         * 
         * @returns {listeners.Observable} The newly created {@link listeners.Observable} object.
         */
        createObservable: function(allowedMessages, createFunctions) {
            var o = new Observable();
            if (allowedMessages) {
                o.registerMessages(allowedMessages, createFunctions);
            }
            return o;
        },
        
        /**
         * 
         * Makes an existing object/class observable by extending the target with the required methods and properties from the {@link listeners.Observable} class.
         * <ul>
         * <li>{@link listeners.Observable#subscribe}</li>
         * <li>{@link listeners.Observable#publish}</li>
         * </ul>
         * 
         * <p>
         * Example code:
         * <js>
         * var someObj = {};
         * listeners.makeObservable(someObj);
         * 
         * someObj.subscribe("someEvent", function() { ... });
         * someObj.publish("someEvent", ...);
         * </js>
         * 
         * @param obj {Object} The instance object to make observable
         * @param proto {prototype} The prototype to apply the Observable methods to. If not provided then the methods are applied directly to the object provided as the first argument.
         * 
         * @return {void}
         */
        makeObservable: function(obj, proto, allowedMessages, createFunctions) {
            if (!proto) {
                proto = obj;
            }
            
            if (!proto._observable) {
                proto._observable = true;
                extend(proto, Observable.prototype);
            }
            
            Observable.call(obj);
            
            if (allowedMessages) {
                obj.registerMessages(allowedMessages, createFunctions);
            }
        },
        
        isObervable: function(o) {
            return o && o.__observable;
        },
        
        /**
         * 
         * @param name
         * @param props
         * @returns {Message}
         */
        createMessage: function(name, data) {
            return new Message(name, data);
        },
        
        /**
         * 
         * @param o
         * @returns {Boolean}
         */
        isMessage: function(o) {
            return o instanceof Message;
        },
        
        /**
         * @function
         * @param callbackFunc
         * @param thisObj
         */
        bind: _bind,
        
        /**
         * Unsubscibes a listener from all of the messages that it has subscribed to.
         * 
         * This method works because all listener handles are registered with the
         * message subscriber (i.e. the "thisObj" provided when subscribing to a message).
         * 
         * When a message is unsubscribed for a subscriber then the listener handle is
         * deregistered.
         * 
         * @param thisObj The subscriber to unsubscribe from all messages
         */
        unsubscribeFromAll: function(thisObj) {
            var handles = thisObj[handlesPropName];
            if (handles) {
                for (var k in handles) {
                    handles[k].unsubscribe();
                }
            }
        }
    });    
});

