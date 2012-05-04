raptor.defineClass(
    'templating.Context',
    function(raptor) {
        var forEachEntry = raptor.forEachEntry,
            escapeXmlAttr = raptor.require("xml.utils").escapeXmlAttr,
            strings = raptor.require('strings'),
            listeners = raptor.require('listeners'),
            nextUniqueId = 0;
        
        var Context = function(writer) {
            this.writer = writer;
            var _this = this;
            this.attributes = {};
            listeners.makeObservable(this, Context.prototype);
        };

        Context.prototype = {
            uniqueId: function() {
                return nextUniqueId++;
            },
            
            write: function(str) {
                for (var args = arguments, i=0; i<args.length; i++) {
                    this.writer.write(args[i]);
                }
                
            },
            
            captureString: function(func, thisObj) {
                var sb = strings.createStringBuilder();
                this.swapWriter(sb, func, thisObj);
                return sb.toString();
            },
            
            swapWriter: function(newWriter, func, thisObj) {
                var oldWriter = this.writer;
                try
                {
                    this.writer = newWriter;
                    func.call(thisObj);
                }
                finally {
                    this.writer = oldWriter;
                }
            },
            
            invokeHandler: function(handler, props, body) {
                if (!props) {
                    props = {};
                }
                props.invokeBody = body;
                handler.process(props, this);
            }
        };
        
        Context.helpers = {
                w: function() {
                    this.write.apply(this, arguments);
                    return this.w;
                },
                
                h: Context.prototype.invokeHandler,
                
                a: function(attrs) {
                    if (!attrs) {
                        return;
                    }
                    
                    forEachEntry(attrs, function(name, value) {
                        this.write(' ' + name + (value == null ? '' : ('="' + escapeXmlAttr(value) + '"')));
                    }, this);
                },
                
                i: function(name, data) {
                    raptor.require("templating").render(name, data, this);
                }
            };
        
        return Context;
        
    });