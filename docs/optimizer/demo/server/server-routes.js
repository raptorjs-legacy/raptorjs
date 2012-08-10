var express = require('express'),
    expressRaptor = require('express-raptor'),
    path = require('path');

module.exports = function(app) {
    app.get('/', expressRaptor.page('/index'));
    app.get('/test', expressRaptor.page('/test'));
    app.use('/bundles', express.static(__dirname + '/build/static/bundles'));
    
    app.configure('development', function(){    
        app.use('/src', express.static(__dirname));
        app.use('/src-core', express.static(path.resolve(__dirname, '../../../../src/main/resources/META-INF/resources/raptor_modules')));
    });
};