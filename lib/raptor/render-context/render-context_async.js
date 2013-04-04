define.extend('raptor/render-context', function() {
    "use strict";

    /* 
     * - Every async fragment will buffer everything after it by changing the writer to a StringBuilder
     * - When an async fragment is completed, it will call flush on the fragment after it
     * - bufferedFragment.flush() will write its output to the prevent fragment
     * - asyncFragment.flush() will do nothing
     * - For nested async fragments:
     *     - The parent async fragment tag handler will store the current async fragment in the context
     *     - the nested async fragment will be linked into the chain
     */
    var DataProviders = require('raptor/render-context/DataProviders');

    return {

        getDataProviders: function(name, args) {
            return this.dataProviders || (this.dataProviders = new DataProviders());
        },

        dataProvider: function(name, callback, thisObj) {
            var dataProviders = this.getDataProviders();
            dataProviders.add.apply(dataProviders, arguments);
        }
    };
});