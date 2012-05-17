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

$rload(function(raptor) {
    "use strict";
    
    /**
     * @parent packaging_Server
     */
    
    var forEach = raptor.forEach,
        forEachEntry = raptor.forEachEntry,
        regexp = raptor.regexp;
    
    /**
     * 
     */
    var ExtensionCollection = function(extensions) {
        this.extensionsLookup = {};
        this.extensionsArray = [];
        
        if (raptor.isArray(extensions)) {
            forEach(extensions, function(ext) {
                this.add(ext);
            }, this);
        }
        else if (typeof extensions === 'object') {
            forEachEntry(extensions, function(ext) {
                this.add(ext);
            }, this);
        }
    };
    
    ExtensionCollection.prototype = {
        /**
         * 
         * @param ext
         */
        add: function(ext) {
            this.extensionsLookup[ext] = true;
            this.extensionsArray.push(ext);
        },
        
        /**
         * 
         * @param ext
         * @returns {Boolean}
         */
        contains: function(ext) {
            return this.extensionsLookup[ext] === true;
        },
        
        /**
         * 
         * @param ext
         * @returns {Boolean}
         */
        containsMatch: function(ext) {
            var regExp;
            
            if (ext instanceof RegExp) {
                regExp = ext;
            }
            else if (ext === "*") {
                return this.extensionsArray.length !== 0;
            }
            else {
                regExp = regexp.simple(ext);
            }
            
            var extensions = this.extensionsArray;
            for (var i=0, len=extensions.length; i<len; i++) {
                if (regExp.test(extensions[i])) {
                    return true;
                }
            }
            
            return false;
        }
    };
    
    raptor.packaging.ExtensionCollection = ExtensionCollection;
});
