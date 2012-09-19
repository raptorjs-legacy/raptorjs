raptor.define(
    "jsdocs.Environment",
    function(raptor) {
        "use strict";
        
        var Type = raptor.require('jsdocs.Type'),
            Tag = raptor.require('jsdocs.Tag'),
            SymbolSet = raptor.require('jsdocs.SymbolSet');
        
        var Environment = function(symbols) {
            this.symbols = symbols || new SymbolSet();
            this.handlers = raptor.require("listeners").createObservable();
            this.global = new Type("object", "Global");
            this.symbols.addSymbol("global", this.global);
            this.tagParsers = {};
        };
        
        Environment.prototype = {
            getGlobal: function() {
                return this.global;
            },
            
            addHandlers: function(handlers, thisObj) {
                this.handlers.subscribe(handlers, thisObj);
            },
            
            addTagParser: function(tagName, parser) {
                this.tagParsers[tagName] = parser;
            },
            
            parseTag: function(tagName, value) {
                var parser = this.tagParsers[tagName],
                    tag = null;
                
                if (parser) {
                    if (typeof parser === 'function') {
                        tag = parser(tagName, value);
                    }
                    else if (parser.parse) {
                        tag = parser.parse(tagName, value);
                    }
                }
                
                return tag || new Tag(tagName, value);
            },
            
            publish: function(name, args) {
                this.handlers.publish(name, args);
            },
            
            getSymbols: function() {
                return this.symbols;
            },
            
            setSymbols: function(symbols) {
                this.symbosl = symbols;
            }
        };
        
        return Environment;
        
        
    });