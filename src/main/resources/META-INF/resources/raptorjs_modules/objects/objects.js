$rload(function(raptor) {

    /**
     * @borrows raptor.forEachEntry as forEachEntry
     * @borrows raptor.keys as keys
     */
    raptor.defineCore('objects', {
        extend: raptor.extend,
        
        
        forEachEntry: raptor.forEachEntry,
       
        keys: raptor.keys,

        /**
         * @static
         */
        values: function(o)
        {
            var k;
            var values = [];
            for (k in o)
            {
                if (o.hasOwnProperty(k))
                {
                    values.push(o[k]);
                }
            }

            return values;
        },

        /**
         * @static
         */
        entries: function(o)
        {
            var k;
            var entries = [];
            for (k in o)
            {
                if (o.hasOwnProperty(k))
                {
                    entries.push({key: k, value: o[k]});
                }
            }

            return entries;
        }
    });    
});