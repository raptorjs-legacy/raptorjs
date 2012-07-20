require("raptor").create({
    logging: {
        loggers: {
            'ROOT': {level: 'WARN'},
            'server': {level: 'INFO'},
            'templating.compiler': {level: 'INFO'},
            'optimizer': {level: 'INFO'},
            'express-raptor': {level: 'INFO'}
        }
    }
});

var path = require('path');
var logger = raptor.require('logging').logger('server');

raptor.require('resources').getSearchPath().addDir(__dirname);
raptor.require('resources').getSearchPath().addDir(path.join(__dirname, 'raptor_modules'));

var expressRaptor = require("express-raptor");

var server = expressRaptor.createServer({
    root: __dirname,
    pagesPath: '/pages',
    watch: true,
    routes: './server-routes'
});

var port = 8080;
server.listen(port);

logger.info("Listening on port " + port);
logger.info("http://localhost:" + port + '/');
