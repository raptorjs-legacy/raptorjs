require('./_helper.js');

var logger = raptor.require('logging').logger("raptor-css-parser-spec"),
    findUrls = function(path) {
        try
        {
            var File = raptor.require('files').File;
            var cssFile = new File(__dirname, path);
            var code = cssFile.readAsString();
            var cssParser = raptor.require('css-parser');
            var urls = {};
            cssParser.findUrls(code, function(url, index, endIndex) {
                urls[url] = [index, endIndex];
            });
            return urls;
        }
        
        catch(e) {
            logger.error(e);
            throw raptor.createError(new Error('Unable to find URLs in CSS at path "' + path + '". Exception: ' + e.toString()), e);
        }
    },
    replaceUrls = function(path, callback, thisObj) {
        try
        {
            var File = raptor.require('files').File;
            var cssFile = new File(__dirname, path);
            var code = cssFile.readAsString();
            var cssParser = raptor.require('css-parser');
            return cssParser.replaceUrls(code, callback, thisObj);
        }
        
        catch(e) {
            logger.error(e);
            throw raptor.createError(new Error('Unable to replace URLs in CSS at path "' + path + '". Exception: ' + e.toString()), e);
        }
    };

describe('css-parser module', function() {

    
    it('should handle replacements for a simple CSS file', function() {
        var code = replaceUrls('resources/css-parser/simple.css', function(url) {
            return url.toUpperCase();
        });
        expect(code).toEqual(".test { background-image: url(IMAGE1.PNG); }\n.test2 { background-image: url(IMAGE2.PNG); }");
    });
    
    it('should handle generic CSS file', function() {
        var urls = findUrls('resources/css-parser/style.css');
        expect(Object.keys(urls).length).toEqual(3);
        expect(urls['d.png']).toNotEqual(null);
        expect(urls['throbber.gif']).toNotEqual(null);
        expect(urls['d.gif']).toNotEqual(null);
    });
});