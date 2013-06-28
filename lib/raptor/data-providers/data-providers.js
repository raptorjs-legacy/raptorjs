define('raptor/data-providers', function() {
    "use strict";


    var DataProviders = require('raptor/data-providers/DataProviders'),
        sharedProviders = new DataProviders();

    return {
        sharedProviders: sharedProviders,

        DataProviders: DataProviders,

        getSharedProviders: function(name, args) {
            return this.sharedProviders;
        },

        register: function(name, callback, thisObj) {
            var dataProviders = this.getSharedProviders();
            dataProviders.register.apply(dataProviders, arguments);
        },

        create: function(parent) {
            return new DataProviders(arguments.length === 0 ? this.sharedProviders : parent);
        }
    };
});