define(
    'raptor/css-parser',
    function(require) {
        "use strict";
        
        var promises = require('raptor/promises');

        return {
            findUrls: function(code, callback, thisObj) {
                var urlRegExp = /url\(\s*"([^\)]*)"\s*\)|url\(\s*'([^\)]*)'\s*\)|url\(([^\)]*)\)/g,
                    matches;
                
                while((matches = urlRegExp.exec(code)) != null) {
                    var url = matches[1] || matches[2] || matches[3];
                    callback.call(thisObj, url.trim(), matches.index + matches[0].indexOf('(')+1, matches.index + matches[0].lastIndexOf(')'));
                }
            },
            
            replaceUrls: function(code, callback, thisObj) {
                var matches = [];
                this.findUrls(code, function(url, start, end) {
                    matches.push({
                        start: start,
                        end: end,
                        url: url,
                        replacement: undefined
                    });
                });

                var promiseArray = [];
                var i, len;

                function handleReplacementPromise(match, replacementPromise) {
                    replacementPromise.then(
                        function(replacement) {
                            match.replacement = replacement;
                        });

                    promiseArray.push(replacementPromise);
                }

                // One pass to resolve the replacements
                for (i=0; i<matches.length; i++) {
                    var match = matches[i];
                    
                    var replacement = callback.call(thisObj, match.url, match.start, match.end);
                    if (replacement) {
                        if (promises.isPromise(replacement)) {
                            handleReplacementPromise(match, replacement);
                        }
                        else {
                            match.replacement = replacement;
                        }
                    }
                }



                function applyReplacements() {
                    // Another pass to apply the replacements.
                    // Start from the and and work backwards
                    // so that start and end indexes remain valid
                    for (var i=matches.length-1; i>=0; i--) {
                        var match = matches[i],
                            start = match.start,
                            end = match.end,
                            replacement = match.replacement;
                        
                        if (replacement != null) {
                            code = code.substring(0, start) + replacement + code.substring(end);   
                        }
                    }
                }
                
                if (promiseArray.length) {
                    var deferred = promises.defer();
                    promises.all(promiseArray)
                        .then(
                            function() {
                                try
                                {
                                    applyReplacements();
                                }
                                catch(e) {
                                    deferred.reject(e);
                                }
                                
                                deferred.resolve(code);
                            },
                            function(e) {
                                deferred.reject(e);
                            });
                    return deferred.promise;
                }
                else {
                    applyReplacements();
                    return code;
                }
            }
        };
    });