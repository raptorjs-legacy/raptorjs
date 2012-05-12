raptor.defineClass(
    'templating.compiler.AttributeSplitter',
    function(raptor) {
        var listeners = raptor.require("listeners"),
            strings = raptor.require("strings"),
            events = ['text', 'expression'],
            Expression = raptor.require('templating.compiler.Expression'),
            regExp = /"(?:[^"]|\\")*"|'(?:[^']|\\')*'|[;=]/g;
        
        /**
         * 
         */
        var AttributeSplitter = function() {
            
        };
        
        /**
         * @memberOf templating.compiler$AttributeSplitter
         * @param attr
         * @param types
         * @param options
         * @returns
         */
        AttributeSplitter.split = function(attr, types, options) {
            
            if (!options) {
                options = {};
            }
            var partStart = 0,
                ordered = options.ordered === true,
                defaultName = options.defaultName,
                matches,
                equalIndex = -1,
                result = ordered ? [] : {},
                finishPart = function(endIndex) {
                    if (partStart === endIndex) {
                        return;
                    }
                    
                    var name,
                        value;
                    
                    if (equalIndex != -1) {
                         name = strings.trim(attr.substring(partStart, equalIndex));
                         value = attr.substring(equalIndex+1, endIndex);
                    }
                    else {
                        if (defaultName) {
                            name = defaultName;
                            value = attr.substring(partStart, endIndex);
                            if (!strings.trim(value).length) {
                                return; //ignore empty parts
                            }
                        }
                        else {
                            name = attr.substring(partStart, endIndex);
                        }
                    }
                    
                    if (name) {
                        name = strings.trim(name);
                    }
                    if (!strings.trim(name).length && !strings.trim(value).length) {
                        return; //ignore empty parts
                    }
                    
                    if (types) {
                        var type = types[name];
                        if (type) {
                            if (value && type.type == "expression") {
                                value = new Expression(value);
                            }
                            if (type.name) {
                                name = type.name;
                            }
                        }
                    }
                    if (ordered) {
                        result.push({name: name, value: value});
                    }
                    else {
                        result[name] = value;
                    }
                    
                };
            
            while((matches = regExp.exec(attr))) {
                //console.error(matches[0]);
                
                if (matches[0] == ';') {
                    finishPart(matches.index);
                    partStart = matches.index+1;
                    equalIndex = -1;
                }
                else if (matches[0] == '=') {
                    equalIndex = matches.index;
                }
                
            }
            
            finishPart(attr.length);
            
            //console.error("AttributeSplitter - result: ", result);
            
            return result;
        };

        return AttributeSplitter;
    });