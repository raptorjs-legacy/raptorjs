var startRegExp = /<!--\s*\[\s*include\s+(\w+)\s*\]\s*-->/g,
    endRegExp = /<!--\s*\[\/\s*include\s*\]\s*-->/g;
    
exports.createInjector = function(pageHtml, pagePath) {
    var injectIndexes = {},
        startMatches, 
        endMatch,
        parts = [],
        begin = 0;
        
        
    startRegExp.lastIndex = 0;
    
    
    while ((startMatches = startRegExp.exec(pageHtml))) {
        var locationName = startMatches[1];
        
        parts.push(pageHtml.substring(begin, startRegExp.lastIndex));
        injectIndexes[locationName] = parts.length;
        parts.push('');
        
        endRegExp.lastIndex = startRegExp.lastIndex;
        
        endMatch = endRegExp.exec(pageHtml);
        if (endMatch) {
            begin = endMatch.index;
            startRegExp.lastIndex = endRegExp.lastIndex;
        }
        else {
            begin = startRegExp.lastIndex;
            parts.push('<!-- [/include] -->');
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