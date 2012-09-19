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
            addSymbol: function(symbol) {
                if (!symbol) {
                    throw raptor.createError(new Error("symbol is null"));
                }
                else if (!symbol.getType()) {
                    throw raptor.createError(new Error("symbol does not have a type"));
                }
                
                this.symbols[symbol.name] = symbol;
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
            
            getCount: function() {
                return Object.keys(this.symbols).length;
            }
        };
        
        return SymbolSet;
        
        
    });