/**
 * @extension Node
 */
define.extend('raptor/promises', function () {
    'use strict';
    var q = require('q');
    return {
        defer: function () {
            return q.defer();
        },
        all: function (array) {
            return q.all(array || []);
        }
    };
});