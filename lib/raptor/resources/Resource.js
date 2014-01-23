/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define.Class('raptor/resources/Resource', ['raptor'], function (raptor, require) {
    'use strict';
    return {
        init: function (searchPathEntry, path) {
            this.setSearchPathEntry(searchPathEntry);
            this.setPath(path);
        },
        lastModified: function () {
            throw raptor.createError('lastModified() not implemented for ' + this.getClass().getName());
        },
        setPath: function (path) {
            this.path = path;
        },
        getPath: function () {
            return this.path;
        },
        getExtension: function () {
            var path = this.path;
            var lastDot = path.lastIndexOf('.');
            return lastDot === -1 ? '' : path.substring(lastDot + 1);
        },
        isFileResource: function () {
            return false;
        },
        getName: function () {
            if (this._name == null) {
                this._name = this.path.substring(this.path.lastIndexOf('/') + 1);
            }
            return this._name;
        },
        getURL: function () {
            throw raptor.createError(new Error('getURL() Not Implemented in ' + this.getClass().getName()));
        },
        readAsString: function (encoding) {
            throw raptor.createError(new Error('Not Implemented'));
        },
        toString: function () {
            var url;
            try {
                url = this.getURL();
            } catch (e) {
                url = '';
            }
            return '[' + this.getClass().getName() + ': path=' + this.getPath() + ', systemPath=' + url + ']';
        },
        exists: function () {
            return true;
        },
        findChild: function (childPath) {
            var resources = require('raptor/resources');
            return resources.findResource(resources.joinPaths(this.getPath(), childPath));
        },
        setSearchPathEntry: function (searchPathEntry) {
            this.searchPathEntry = searchPathEntry;
        },
        getSearchPathEntry: function () {
            return this.searchPathEntry;
        },
        getDirPath: function () {
            if (!this.dirPath) {
                var resourcePath = this.getPath();
                var packageDirPathMatches = resourcePath.match(/[\\\/][^\\\/]+$/);
                this.dirPath = resourcePath.substring(0, packageDirPathMatches.index);
            }
            return this.dirPath;
        },
        getParent: function () {
            throw raptor.createError(new Error('getParent() Not Implemented' + this.getClass().getName()));
        },
        resolve: function (baseResource, path) {
            throw raptor.createError(new Error('resolve() Not Implemented for ' + this.getClass().getName()));
        },
        watch: function () {
        }
    };
});