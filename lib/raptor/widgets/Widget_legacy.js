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
 * Widget mixin methods that have been deprecated and should no longer be used (optional).
 * @mixin
 * 
 * @extension Legacy
 */
define.extend('raptor/widgets/Widget', ['raptor'], function (raptor, require, target) {
    'use strict';
    var arrayFromArguments = raptor.arrayFromArguments;
    target.legacy = true;
    return {
        getRootEl: function () {
            return this.getEl();
        },
        getRootElId: function () {
            return this.getElId();
        },
        getChild: function (nestedWidgetId) {
            return this.getWidget(nestedWidgetId);
        },
        getChildren: function (nestedWidgetId) {
            return this.getWidget(nestedWidgetId);
        },
        getParent: function () {
            return this._parentWidget;
        },
        getChildWidget: function (nestedWidgetId) {
            return this.getChild(nestedWidgetId);
        },
        getChildWidgets: function (childWidgetsId) {
            return this.getChildren.apply(this, arguments);
        },
        getParentWidget: function () {
            return this._parentWidget;
        },
        notify: function (name, args) {
            return this.publish(name, arrayFromArguments(arguments, 1));
        },
        getDoc: function () {
            return this.widgets;
        }
    };
});