raptor.defineModule('templating', function(raptor) {

    var registeredTemplates = {},
        loadedTemplates = {},
        forEachEntry = raptor.forEachEntry,
        isArray = raptor.isArray,
        strings = raptor.require('strings'),
        escapeXml = raptor.require('xml.utils').escapeXml,
        escapeXmlAttr = raptor.require('xml.utils').escapeXmlAttr,
        Context = raptor.require("templating.Context"),
        empty = function(o) {
            if (!o) {
                return true;
            }
            
            if (typeof o === 'string') {
                return !strings.trim(o).length;
            }
            
            if (isArray(o)) {
                return !o.length;
            }
            
            return true;
        },
        getHandler = function(name) {
            var Handler = raptor.require(name),
                instance;
            
            if (!(instance = Handler.instance)) {
                instance = Handler.instance = new Handler();
            }
            
            return instance;
        };
    
    return {
        getTemplateFunc: function(templateName) {
            var templateFunc = loadedTemplates[templateName];
            if (!templateFunc) {
                if ((templateFunc = registeredTemplates[templateName])) {
                    templateFunc = templateFunc(this.helpers);
                }
                
                if (!templateFunc) {
                    raptor.throwError(new Error('Template not found with name "' + templateName + '"'));
                }
                loadedTemplates[templateName] = templateFunc;
            }
            
            return templateFunc;
            
        },
        
        render: function(templateName, data, context) {
            if (!context) {
                raptor.throwError(new Error("Context is required"));
            }
            
            
            try
            {
                this.getTemplateFunc(templateName)(data || {}, context, context._helpers);
            }
            catch(e) {
                raptor.throwError(new Error('Unable to render template with name "' + templateName + '". Exception: ' + e), e);
            }
        },
        
        renderToString: function(templateName, data, context) {
            var sb = strings.createStringBuilder(),
                _this = this;
            
            var _render = function() {
                _this.render(templateName, data, context);
            };
            
            if (context) {
                context.swapWriter(sb, _render);
            }
            else {
                context = this.createContext(sb);
                _render();
            }
            
            return sb.toString();
        },
        
        register: function(name, templateFunc) {
            registeredTemplates[name] = templateFunc;
            delete loadedTemplates[name];
        },
        
        createContext: function(writer) {
            var context = new Context(writer);
            
            var contextHelpers = {};
            
            forEachEntry(Context.helpers, function(name, func) {
                contextHelpers[name] = function() {
                    return func.apply(context, arguments);
                };
            });
            
            context._helpers = contextHelpers;
            return context;
        },
        
        helpers: {
            h: getHandler,
            
            /**
             * forEach helper function
             * 
             * @param list
             * @param callback
             * @returns
             */
            f: function(list, callback) {
                if (!list) return;
                if (!isArray(list)) {
                    list = [list];
                }
                
                var i=0, 
                    len=list.length,
                    loopStatus = {
                        getLength: function() {
                            return len;
                        },
                        isLast: function() {
                            return i === len-1;
                        },
                        isFirst: function() {
                            return i === 0;
                        },
                        getIndex: function() {
                            return i;
                        }
                    };
                
                for (; i<len; i++) {
                    var o = list[i];
                    callback(o || '', loopStatus);
                }
            },
            
            e: empty,
            
            ne: function(o) {
                return !empty(o);
            },
            
            /**
             * escapeXml helper function
             * 
             * @param str
             * @returns
             */
            x: escapeXml,
            xa: escapeXmlAttr,
            
            nx: function(str) {
                return {
                    toString: function() {
                        return str;
                    }
                };
            }
        }
    };
    
});

raptor.global.$rtmpl = function(name, func) {
    raptor.require('templating').register(name, func);
};
