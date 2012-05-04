raptorBootstrap.env = "rhino";
raptorBootstrap.require = function(path) {
    __rhinoHelpers.getBootstrap().require(path);
};

raptorBootstrap.load();