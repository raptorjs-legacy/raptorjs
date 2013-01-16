require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

var files = require('raptor/files'),
    File = require('raptor/files/File');

describe('files spec', function() {
    
    it("should allow for reading files", function() {
        var file = new File(__dirname, 'resources/files/a.txt');
        var a = file.readAsString();
        expect(a).toEqual('a');
    });


    it("should allow for converting file paths to URLs", function() {
        var url = files.fileUrl(__filename);
        expect(url).toEqual('file:///Users/psteeleidem/development/ebay/github/Raptor/RaptorJSOpenSource/test/raptor-files-spec.js');

        url = files.fileUrl(__dirname + '/with spaces.js');
        expect(url).toEqual('file:///Users/psteeleidem/development/ebay/github/Raptor/RaptorJSOpenSource/test/with%20spaces.js');
    });
});