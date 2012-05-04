raptor.defineClass(
    "xml.sax.BaseSaxParser",
    function() {
        var listeners = raptor.require("listeners"),
            arrayFromArguments = raptor.arrayFromArguments;
        
        var BaseSaxParser = function() {
            this.observable = listeners.createObservable(['startElement', 'endElement', 'characters', 'error']);
        };
        
        BaseSaxParser.prototype = {
            on: function(events, thisObj) {
                this.observable.subscribe.apply(this.observable, arguments);
            },
            
            _startElement: function(el) {
                this.observable.publish("startElement", el);
            },
            
            _endElement: function(el) {
                this.observable.publish("endElement", el);
            },
            
            _characters: function(text) {
                //Normalize EOL sequence...
                text = text.replace(/\r\n|\r/g, "\n");
                this.observable.publish("characters", text);
            },
            
            _comment: function(comment) {
                this.observable.publish("comment", comment);
            },
            
            _error: function() {
                var args = arrayFromArguments(arguments);
                this.observable.publish("error", args);
            }
        };
        
        return BaseSaxParser;
        
    });