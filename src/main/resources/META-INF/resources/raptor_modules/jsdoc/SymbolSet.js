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
raptor.define(
    "jsdoc.SymbolSet",
    function(raptor) {
        "use strict";
        
        var SymbolSet = function() {
            this.symbols = {};
            raptor.require('listeners').makeObservable(this, SymbolSet.prototype, ['newSymbol']);
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
                return this.symbols[name];
            },
            
            toArray: function() {
                return raptor.require('objects').values(this.symbols);
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