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
    "jsdocs.SymbolSet",
    function(raptor) {
        "use strict";
        
        var SymbolSet = function() {
            this.symbols = {};
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
            },
            
            toString: function() {
                var symbols = [];
                
                raptor.forEachEntry(this.symbols, function(name, symbol) {
                    symbols.push(symbol.toString());
                });
                
                return symbols.join("\n");
            },
            
            hasSymbol: function(name) {
                return this.symbols.hasOwnProperty(name);
            },
            
            getSymbol: function(name) {
                return this.symbols[name];
            },
            
            getSymbols: function() {
                return raptor.require('objects').values(this.symbols);
            },
            
            getCount: function() {
                return Object.keys(this.symbols).length;
            }
        };
        
        return SymbolSet;
        
        
    });