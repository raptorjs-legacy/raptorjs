define(
    'raptor/css-parser',
    function(require) {
        "use strict";
        
        return {
            findUrls: function(code, callback, thisObj) {
                var urlRegExp = /url\(\s*"([^\)]*)"\s*\)|url\(([^\)]*)\)/g,
                    matches;
                
                while((matches = urlRegExp.exec(code)) != null) {
                    var url = matches[1] || matches[2];
                    callback.call(thisObj, url.trim(), matches.index + matches[0].indexOf('(')+1, matches.index + matches[0].lastIndexOf(')'));
                }
            },
            
            replaceUrls: function(code, callback, thisObj) {
                var matches = [];
                this.findUrls(code, function(url, start, end) {
                    matches.push(arguments);
                });
                
                for (var i=matches.length-1; i>=0; i--) {
                    var match = matches[i],
                        start = match[1],
                        end = match[2];
                    
                    var newUrl = callback.apply(thisObj, match);
                    if (newUrl) {
                        code = code.substring(0, start) + newUrl + code.substring(end);   
                    }
                }
                
                return code;
            }
        };
    });