raptor.defineClass(
    "optimizer.HtmlInjector",
    function(raptor) {
        "use strict";
        
        var startRegExp = /<!--\s*\[\s*raptor-include\:?\s+(\w+)\s*\]\s*-->/g,
            endRegExp = /<!--\s*\[\/\s*raptor-include\s*\]\s*-->/g;
        
        var HtmlInjector = function(pageHtml, keepMarkers) {
            this.keepMarkers = keepMarkers === true;
            this.parts = [];
            this.injectIndexes = {};
            this.findSlots(pageHtml);
        };
        
        HtmlInjector.prototype = {
            findSlots: function(pageHtml) {
                var injectIndexes = this.injectIndexes,
                    parts = this.parts,
                    startMatches, 
                    endMatch,
                    begin = 0;
                    
                    
                startRegExp.lastIndex = 0;
                
                
                while ((startMatches = startRegExp.exec(pageHtml))) {
                    var locationName = startMatches[1];
                    
                    parts.push(pageHtml.substring(begin, startMatches.index));
                    
                    injectIndexes[locationName] = parts.length;
                    parts.push('');
                    
                    endRegExp.lastIndex = startRegExp.lastIndex;
                    
                    endMatch = endRegExp.exec(pageHtml);
                    if (endMatch) {
                        if (this.keepMarkers) {
                            begin = endMatch.index;
                        }
                        else {
                            begin = endRegExp.lastIndex;
                        }
                        
                        startRegExp.lastIndex = endRegExp.lastIndex;
                    }
                    else {
                        begin = startRegExp.lastIndex;
                    }
                    
                }
                
                if (begin < pageHtml.length) {
                    parts.push(pageHtml.substring(begin));
                }
            },
            
            inject: function(location, injectHtml) {
                var injectIndex = this.injectIndexes[location];
                if (injectIndex === undefined) {
                    throw raptor.createError(new Error('Starting marker not found for location "' + location + '"'));
                }
                this.parts[injectIndex] = this.keepMarkers ? ('<!-- [raptor-include: ' + location + '] -->' + injectHtml + '<!-- [/raptor-include] -->') : injectHtml;
            },
            
            getHtml: function() {
                return this.parts.join('');
            }
        };
        
        return HtmlInjector;
    });