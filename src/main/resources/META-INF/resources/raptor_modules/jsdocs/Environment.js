raptor.define(
    "jsdocs.Environment",
    function(raptor) {
        "use strict";
        
        var Type = raptor.require('jsdocs.Type'),
            Tag = raptor.require('jsdocs.Tag');
        
        var Environment = function() {
            this.handlers = raptor.require("listeners").createObservable();
            this.global = new Type("object");
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
            }
        };
        
        return Environment;
        
        
    });