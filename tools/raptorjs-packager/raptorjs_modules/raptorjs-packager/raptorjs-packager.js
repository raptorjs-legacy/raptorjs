raptor.defineModule("raptorjs-packager", function(raptor) {
    var PackagesWriter = raptor.require("raptorjs-packager.PackagesWriter");
    
    return {
        
        writePackages: function(options) {
            var writer = new PackagesWriter(options); 
            writer.writePackages();
        }
    };
});