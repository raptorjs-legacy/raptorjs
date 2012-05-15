$rload(function(raptor) {

    var loadedFiles = {};
    
    raptor.defineCore('runtime', {
        evaluateResource : function(resource) {
            resource = raptor.resources.findResource(resource);
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
                var source = resource.readFully();
                this.evaluateString(source, resource.getSystemPath());
            }
        }
    });    
});