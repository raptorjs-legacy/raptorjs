define.extend('raptor/temp', function(require, target) {
    var File = require('raptor/files/File');

    var workDir = null;

    var temp = {
        time: Date.now(),
        setWorkDir: function(newWorkDir) {
            if (typeof newWorkDir === 'string') {
                newWorkDir = new File(newWorkDir);
            }
            workDir = newWorkDir;
        },
        getWorkDir: function() {
            return workDir;
        }
    };

    Object.defineProperty(target, "workDir", {
        get: temp.getWorkDir,
        set: temp.setWorkDir,
        enumerable: true
    });

    return temp;
})