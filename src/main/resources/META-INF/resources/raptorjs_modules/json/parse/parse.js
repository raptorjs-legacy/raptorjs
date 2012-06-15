raptor.defineModule(
    'json.parse',
    function() {
        var NON_ASCII = /[^\x00-\x7F]/g,
            strings = raptor.require("strings"),
            unicodeEncode = strings.unicodeEncode; //Pick up the unicodeEncode method from the strings module

        
        return {
            /**
             * 
             * @param s
             * @returns
             */
            parse: function(s) {
                if (typeof s === 'string') {
                    // Replace any non-ascii characters with their corresponding unicode sequence
                    s = s.replace(NON_ASCII, function(c) {
                        return unicodeEncode(c);
                    });
    
                    return eval('(' + s + ')');
                } else {
                    raptor.errors.throwError(new Error('String expected'));
                }
            }
        };
    });