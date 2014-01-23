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
/**
 * @extension Browser
 */
define.extend('raptor/loader', ['raptor'], function (raptor, require) {
    'use strict';
    var resourcesRegistered = false;
    return {
        handle_js: function (include, transaction) {
            var url = include.src || include.url || include;
            transaction._add(url, include, this.includeJSImpl, this);
        },
        handle_css: function (include, transaction) {
            var url = include.href || include.url || include;
            transaction._add(url, include, this.includeCSSImpl, this);
        },
        includeJS: function (src, callback, thisObj) {
            return this.include({ js: [src] }, callback, thisObj);
        },
        includeCSS: function (href, callback, thisObj) {
            return this.include({ css: [href] }, callback, thisObj);
        },
        registerResources: function () {
            var scripts = document.getElementsByTagName('script'), scriptsLen = scripts.length, links = document.getElementsByTagName('link'), linksLen = links.length, i;
            for (i = 0; i < scriptsLen; i++) {
                this.setDownloaded(scripts[i].src || scripts[i].href);
            }
            for (i = 0; i < linksLen; i++) {
                this.setDownloaded(links[i].src || links[i].href);
            }
        },
        beforeInclude: function () {
            if (!resourcesRegistered) {
                this.registerResources();
            }
            resourcesRegistered = true;
        }
    };
});