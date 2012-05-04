raptorBuilder.addLoader(function(raptor) {

    var loadedFiles = {};
    
    raptor.defineCore('runtime', {
        evaluateResource : function(resource) {
            resource = raptor.resources.findResourceSync(resource);
            if (resource.exists() === false)
            {
                raptor.errors.throwError(new Error('Resource not found: ' + resource.getPath()));
            }
            
            if (resource.isFileResource())
            {
                var filePath = resource.getFilePath();
                if (loadedFiles[filePath] !== true) {
                    this.evaluateFile(filePath);
                    loadedFiles[filePath] = true;
                }
            }
            else
            {
                var source = resource.readFullySync();
                this.evaluateString(source, resource.getSystemPath());
            }
        }
    });    
});