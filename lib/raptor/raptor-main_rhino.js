var raptor = require('./raptor_server.js').load('rhino');
var RhinoResMgrSearchPathEntryAdapter = raptor.require('raptor/resources/RhinoResMgrSearchPathEntryAdapter');
var resources = raptor.require('raptor/resources');
var searchPath = resources.getSearchPath();
searchPath.addEntry(new RhinoResMgrSearchPathEntryAdapter());

__rhinoHelpers.resources.onResourcesModified(function() {
    searchPath.publish('modified');
}, this);

module.exports = raptor;