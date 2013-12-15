define.Class(
    'raptor/optimizer/BundleConfig',
    ['raptor'],
    function(raptor, require) {
        'use strict';
        
        var BundleConfig = function() {
            this.name = null;
            this.checksumsEnabled = undefined;
            this.dependencies = [];
            this.enabled = true;
            this.wrappers = undefined;
        };

        BundleConfig.prototype = {
            addDependency: function(dependency) {
                this.dependencies.push(dependency);
            },
            forEachDependency: function(callback, thisObj) {
                raptor.forEach(this.dependencies, callback, thisObj);
            },
            toString: function() {
                return "[BundleConfig name=" + this.name + ", dependencies=[" + this.dependencies.join(",") + "]]";
            },
            enableWrapper: function(wrapperId) {
                if (!this.wrappers) {
                    this.wrappers = {};
                }
                this.wrappers[wrapperId] = true;
            },
            disableWrapper: function(wrapperId) {
                if (!this.wrappers) {
                    this.wrappers = {};
                }
                this.wrappers[wrapperId] = false;
            }
        };
        
        return BundleConfig;
    });