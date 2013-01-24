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
define.extend(
    'raptor/widgets/Widget',
    ['raptor'],
    function(raptor, require, target) {
        "use strict";
        
        var arrayFromArguments = raptor.arrayFromArguments;
        
        target.legacy = true;
        
        return {
            
            /**
             * 
             * @deprecated Use {@Link raptor/widgets/Widget#getWidget} instead
             */
            getChild: function(nestedWidgetId) {
                return this.getWidget(nestedWidgetId);
            },
            
            /**
             * @deprecated Use {@Link raptor/widgets/Widget#getWidgets} instead
             */
            getChildren: function(nestedWidgetId) {
                return this.getWidget(nestedWidgetId);
            },
            
            /**
             * 
             * Returns the parent widget instance for this widget.
             * 
             * @returns {raptor/widgets/Widget} The parent widget for this widget or null if this widget does not have a parent.
             *
             * @deprecated Do not use this method
             */
            getParent: function() {
                return this._parentWidget;
            },
            
            /**
             * @deprecated Use getWidget instead
             * 
             * @param nestedWidgetId
             * @returns
             */
            getChildWidget: function(nestedWidgetId) {
                return this.getChild(nestedWidgetId);
            },
            
            /**
             * @deprecated Use getWidgets instead
             * @param childWidgetsId
             * @returns
             */
            getChildWidgets: function(childWidgetsId) {
                return this.getChildren.apply(this, arguments);
            },
            
            /**
             * @deprecated Use getParent instead
             * @returns
             */
            getParentWidget: function() {
                return this._parentWidget;
            },
            
            /**
             * Sends a notification to subscribers using the provided name and arguments.
             * 
             * This method is slightly different from the {@Link raptor/widgets/Widget#publish}
             * in that the variable arguments will be passed directly to the subscribers.
             * <b>This method will be removed in the future.</b> 
             * 
             * @function
             * @name notify
             * @param name {String} The message name
             * @param ...args {Object} A variable set of arguments
             * @memberOf raptor/widgets/Widget
             * 
             * @deprecated Use {@Link raptor/widgets/Widget#publish} instead
             */
            notify: function(name, args) {
                return this.publish(name, arrayFromArguments(arguments, 1));
            }
        };
    });