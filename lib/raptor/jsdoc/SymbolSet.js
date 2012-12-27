/**
 * Different types of symbols:
 * 
 * my-module.MyClass
 * my-module.MyClass.prototype#myMethod
 * my-module#MyClass
 * my-module#myMethod
 * 
 * my-module-MyAnonClass
 * 
 */
define(
    "raptor/jsdoc/SymbolSet",
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";

        var strings = require('raptor/strings');
        
        var SymbolSet = function() {
            this.symbols = {};
            require('raptor/listeners').makeObservable(this, SymbolSet.prototype, ['newSymbol']);
        };
        
        SymbolSet.prototype = {
            addSymbol: function(name, type) {
                if (!name || typeof name !== 'string') {
                    throw raptor.createError(new Error("invalid symbol"));
                }
                
                if (!type) {
                    throw raptor.createError(new Error("type is null"));
                }
                
                if (!type.getName()) {
                    type.setName(name);
                }
                this.symbols[name] = type;
                
                this.publish('newSymbol', {
                    name: name,
                    type: type
                });
            },

            filter: function(callback, thisObj) {
                var entries = require('raptor/objects').entries(this.symbols);
                entries.forEach(function(entry) {
                    var result = callback.call(thisObj, entry.key, entry.value);
                    if (result !== true) {
                        delete this.symbols[entry.key];
                    }
                }, this);
            },
            
            toString: function() {
                var symbols = [];
                
                raptor.forEachEntry(this.symbols, function(name, type) {
                    symbols.push(name + ': ' + type.toString('  '));
                });
                
                return symbols.join("\n");
            },
            
            hasSymbol: function(name) {
                return this.symbols.hasOwnProperty(name);
            },
            
            getSymbolType: function(name) {
                var type = this.symbols[name];
                return type;
            },
            
            resolveSymbolType: function(name) {
                var lastHash = name.lastIndexOf("#");
                var propName = null;
                if (lastHash !== -1) {
                    propName = name.substring(lastHash+1);
                    name = name.substring(0, lastHash);
                }

                var type = null,
                    suffixPropName = false;


                var handleSuffix = function(suffix) {
                    if (suffixPropName) {
                        return;
                    }
                    var suffixToCheck = "." + suffix;

                    if (strings.endsWith(name, suffixToCheck)) {
                        suffixPropName = suffix;
                        name = name.substring(0, name.length-suffixToCheck.length);
                    }
                };
                
                handleSuffix("prototype");
                handleSuffix("this");

                type = this.symbols[name];

                if (type && suffixPropName) {
                    type = type.getPropertyType(suffixPropName);
                }

                if (type && propName) {
                    type = type.getPropertyType(propName);
                }

                return type;
            },
            
            toArray: function() {
                return require('raptor/objects').values(this.symbols);
            },
            
            getSymbolNames: function() {
                return Object.keys(this.symbols);
            },
            
            getCount: function() {
                return Object.keys(this.symbols).length;
            },
            
            forEachSymbol: function(callback, thisObj) {
                raptor.forEachEntry(this.symbols, callback, thisObj);
            }
        };
        
        return SymbolSet;
        
        
    });