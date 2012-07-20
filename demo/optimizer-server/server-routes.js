var express = require('express'),
    path = require('path');

module.exports = function(app) {
    app.get('/', app.raptor.page('/index'));
    app.use('/bundles', express.static(__dirname + '/build/static/bundles'));
    
    app.configure('development', function(){    
        app.use('/src', express.static(__dirname));
        app.use('/src-core', express.static(path.resolve(__dirname, '../../src/main/resources/META-INF/resources/raptor_modules')));
    });
};