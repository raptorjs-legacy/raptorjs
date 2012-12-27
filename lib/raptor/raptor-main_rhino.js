var raptor = require('./raptor_server.js').load('rhino');
var RhinoResMgrSearchPathEntryAdapter = raptor.require('raptor/resources/RhinoResMgrSearchPathEntryAdapter');
var resources = raptor.require('raptor/resources');
resources.addSearchPathEntry(new RhinoResMgrSearchPathEntryAdapter());
module.exports = raptor;