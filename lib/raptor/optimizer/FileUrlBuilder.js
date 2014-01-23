define('raptor/optimizer/FileUrlBuilder', ['raptor'], function (raptor, require, exports, module) {
    'use strict';
    var FileUrlBuilder = function (config) {
        if (!config) {
            throw new Error('config is required');
        }
        this.config = config;
        this.urlPrefix = config.getUrlPrefix();
        this.outputDir = config.getOutputDir();
        this.includeSlotName = config.includeBundleSlotNames === true;
    };
    FileUrlBuilder.prototype = {
        buildBundleUrl: function (bundle, context) {
            if (!context) {
                throw new Error('context is required');
            }
            var basePath = context.basePath;
            if (bundle.url) {
                return bundle.url;
            } else if (bundle.inPlaceDeployment === true && bundle.sourceResource) {
                if (!bundle.sourceResource.isFileResource()) {
                    throw raptor.createError(new Error('In-place deployment is only supported for file resources. Source resource: ' + bundle.sourceResource));
                }
                var url = this.config.getUrlForSourceFile(bundle.sourceResource.getFilePath());
                if (url == null) {
                    if (basePath) {
                        return require('path').relative(basePath, bundle.sourceResource.getFilePath());
                    } else {
                        return bundle.sourceResource.getURL();
                    }
                }
                return url;
            }
            var prefix = this.getPrefix(basePath), bundleFilename = this.getBundleFilename(bundle, context);
            if (!prefix.endsWith('/') && !bundleFilename.startsWith('/')) {
                prefix += '/';
            }
            return prefix + bundleFilename;
        },
        getInPlaceResourceUrl: function (filePath, basePath) {
            var config = this.config;
            if (config.hasServerSourceMappings()) {
                return config.getUrlForSourceFile(filePath);
            } else if (basePath) {
                return require('path').relative(basePath, filePath);
            } else {
                return null;
            }
        },
        buildResourceUrl: function (filename, context) {
            var basePath = context.basePath || this.config.getBasePath();
            var prefix = this.getPrefix(basePath);
            if (!prefix.endsWith('/') && !filename.startsWith('/')) {
                prefix += '/';
            }
            return prefix + filename;
        },
        getBundleFilename: function (bundle, context) {
            var filename = bundle.getName();
            var ext = '.' + this.getFileExtension(bundle);
            if (filename.endsWith(ext)) {
                filename = filename.slice(0, 0 - ext.length);
            }
            var checksum;
            if (bundle.sourceDependency && bundle.sourceDependency.hasModifiedChecksum()) {
                var lastSlash = filename.lastIndexOf('/');
                if (lastSlash != -1) {
                    filename = filename.substring(lastSlash + 1);
                }
                checksum = bundle.sourceDependency.getModifiedChecksum(context);
            } else {
                checksum = bundle.getChecksum();
            }
            filename = filename.replace(/^\//, '').replace(/[^A-Za-z0-9_\-\.]/g, '-') + (this.includeSlotName ? '-' + bundle.getSlot() : '') + (checksum ? '-' + checksum : '') + ext;
            return filename;
        },
        getFileExtension: function (bundle) {
            return require('raptor/mime').extension(bundle.getContentType());
        },
        getPrefix: function (basePath) {
            var prefix = this.urlPrefix;
            if (!prefix) {
                if (basePath) {
                    var toPath = this.outputDir.toString();
                    var fromPath = basePath.toString();
                    prefix = require('path').relative(fromPath, toPath) + '/';
                    if (prefix === '/') {
                        prefix = './';
                    }
                } else {
                    prefix = '/static/';
                }
            }
            return prefix;
        }
    };
    return FileUrlBuilder;
});