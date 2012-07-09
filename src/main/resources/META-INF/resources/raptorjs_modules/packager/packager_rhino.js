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
     * @extension Server
     */
    raptor.extendCore('packager', {
        rhinoCreateExtensions: function(javaExtensionSet) {
            var extensions = new raptor.packager.ExtensionCollection();
            if (javaExtensionSet) {
                var javaIterator = javaExtensionSet.iterator();
                while(javaIterator.hasNext())
                {
                    var javaExtensionStr = javaIterator.next();
                    extensions.add('' + javaExtensionStr);
                }
            }
            
            return extensions;
        }
    });

});