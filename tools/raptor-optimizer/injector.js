var startRegExp = /<!--\s*\[\s*raptor-include\:?\s+(\w+)\s*\]\s*-->/g,
    endRegExp = /<!--\s*\[\/\s*raptor-include\s*\]\s*-->/g;
    
exports.createInjector = function(pageHtml, pagePath, keepMarkers) {
    var injectIndexes = {},
        startMatches, 
        endMatch,
        parts = [],
        begin = 0;
        
        
    startRegExp.lastIndex = 0;
    
    
    while ((startMatches = startRegExp.exec(pageHtml))) {
        var locationName = startMatches[1];
        
        if (keepMarkers) {
            parts.push(pageHtml.substring(begin, startRegExp.lastIndex));    
        }
        else {
            parts.push(pageHtml.substring(begin, startMatches.index));
        }
        
        injectIndexes[locationName] = parts.length;
        parts.push('');
        
        endRegExp.lastIndex = startRegExp.lastIndex;
        
        endMatch = endRegExp.exec(pageHtml);
        if (endMatch) {
            if (keepMarkers) {
                begin = endMatch.index;
            }
            else {
                begin = endRegExp.lastIndex;
            }
            
            startRegExp.lastIndex = endRegExp.lastIndex;
        }
        else {
            begin = startRegExp.lastIndex;
            if (keepMarkers) {
                parts.push('<!-- [/raptor-include] -->');    
            }
            
        }
        
    }
    
    if (begin < pageHtml.length) {
        parts.push(pageHtml.substring(begin));
    }
    
    

    return {
        inject: function(location, injectHtml) {
            var injectIndex = injectIndexes[location];
            if (injectIndex === undefined) {
                raptor.throwError(new Error('Starting marker not found for location "' + location + '" in page "' + pagePath + '"'));
            }
            parts[injectIndex] = injectHtml;
        },
        
        getHtml: function() {
            return parts.join('');
        }
    };
};