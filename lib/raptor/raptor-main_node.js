var raptor = require('./raptor_server.js').load('node');
var File = raptor.require('raptor/files/File');
var resources = raptor.require('raptor/resources');
var packaging = raptor.require('raptor/packaging');
var path = require('path');

resources.getSearchPath().addDir(new File(__dirname).getParent());

/**
 * Searches for modules that are nested one-level deep and
 * reads the package.json file to determine if any
 * the RaptorJS resource search path needs to be updated.
 * 
 * @param  {files/file/File} dir The module directory
 * @return {void}
 */
function enableNestedRaptorModules(dir) {
    var nestedModuleDirs = dir.listFiles();
    nestedModuleDirs.forEach(function(nestedDir) {
        if (nestedDir.isDirectory()) {
            var packageJsonFile = new File(nestedDir, "package.json");
            if (packageJsonFile.exists()) {
                var packageResource = resources.createFileResource(packageJsonFile);
                var packageManifest = packaging.getPackageManifest(packageResource);
                resources.addSearchPathsFromManifest(packageManifest);
            }
        }
    })
}

// Discover RaptorJS modules in the node_modules directory:

// If node is installed into an app as a top-level module using "npm install" (and not "npm link") then
// current directory will be <project-dir>/node_modules/raptor/lib/raptor
var node_modulesDir = new File(path.join(__dirname, '../../../')); // Walk up three directories to find the "node_modules" dir
if (node_modulesDir.exists() && node_modulesDir.getName() === 'node_modules') {
    enableNestedRaptorModules(node_modulesDir);
}
else {
    // As a back up look in for a "node_modules" directory in the CWD for the process
    node_modulesDir = new File(path.join(process.cwd(), 'node_modules'));
    if (node_modulesDir.exists()) {
        enableNestedRaptorModules(node_modulesDir);
    }
}

module.exports = raptor;