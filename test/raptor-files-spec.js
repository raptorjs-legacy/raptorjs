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
        expect(url.startsWith('file:///')).toEqual(true);
        expect(url.endsWith('/test/raptor-files-spec.js')).toEqual(true);

        url = files.fileUrl(__dirname + '/with spaces.js');
        expect(url.startsWith('file:///')).toEqual(true);
        expect(url.endsWith('/test/with%20spaces.js')).toEqual(true);
    });
});