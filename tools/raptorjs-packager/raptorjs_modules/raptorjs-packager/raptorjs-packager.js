raptor.defineModule("raptorjs-packager", function(raptor) {
    var BundlesWriter = raptor.require("raptorjs-packager.BundlesWriter");
    
    return {
        
        writeBundles: function(options) {
            var writer = new BundlesWriter(options); 
            writer.writeBundles();
        }
    };
});