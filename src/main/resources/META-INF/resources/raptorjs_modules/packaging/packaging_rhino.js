$rload(function(raptor) {

    /**
     * @extension Server
     */
    raptor.extendCore('packaging', {
        rhinoCreateExtensions: function(javaExtensionSet) {
            var extensions = new raptor.packaging.ExtensionCollection();
            if (javaExtensionSet) {
                var javaIterator = javaExtensionSet.iterator();
                while(javaIterator.hasNext())
                {
                    var javaExtensionStr = javaIterator.next();
                    extensions.add('' + javaExtensionStr);
                }
            }
            
            return extensions;
        }
    });

});