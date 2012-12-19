var raptor = require('./raptor_server.js').load('rhino');
var File = raptor.require('raptor/files/File');
raptor.require('raptor/resources').getSearchPath().addDir(new File(__dirname).getParent());
module.exports = raptor;