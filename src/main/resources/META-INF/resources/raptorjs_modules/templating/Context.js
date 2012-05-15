raptor.defineClass(
    'templating.Context',
    function(raptor) {
        var forEachEntry = raptor.forEachEntry,
            escapeXmlAttr = raptor.require("xml.utils").escapeXmlAttr,
            strings = raptor.require('strings'),
            listeners = raptor.require('listeners'),
            nextUniqueId = 0;
        
        /**
         * 
         */
        var Context = function(writer) {
            this.writer = writer;
            var _this = this;
            this.attributes = {};
            listeners.makeObservable(this, Context.prototype);
        };

        Context.prototype = {
            /**
             * 
             * @returns {Number}
             */
            uniqueId: function() {
                return nextUniqueId++;
            },
            
            /**
             * 
             * @param str
             */
            write: function(str) {
                if (str == null) {
                    return;
                }
                this.writer.write(str);
                
            },
            
            /**
             * 
             * @param func
             * @param thisObj
             * @returns
             */
            captureString: function(func, thisObj) {
                var sb = strings.createStringBuilder();
                this.swapWriter(sb, func, thisObj);
                return sb.toString();
            },
            
            /**
             * 
             * @param newWriter
             * @param func
             * @param thisObj
             */
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
            
            /**
             * 
             * @param handler
             * @param props
             * @param body
             */
            invokeHandler: function(handler, props, body) {
                if (!props) {
                    props = {};
                }
                props.invokeBody = body;
                handler.process(props, this);
            },
            
            getHelpers: function() {
                return this._helpers;
            }
        };
        
        Context.helpers = {
                w: function(str) {
                    this.write(str);
                    return this.getHelpers().w;
                },
                
//                w: function() {
//                    for (var args = arguments, i=0, len=args.length; i<len; i++) {
//                        this.write(args[i]);
//                    }
//                    return this.getHelpers().w;
//                },
                
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