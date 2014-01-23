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
 * @extension Node
 */
define.extend('raptor/js-minifier', function (require) {
    'use strict';
    var parser = require('uglify-js').parser;
    var uglify = require('uglify-js').uglify;
    return {
        minify: function (src, options) {
            if (!options) {
                options = {};
            }
            var ast = parser.parse(src, options.strict_semicolons === true);
            if (options.lift_variables === true) {
                ast = uglify.ast_lift_variables(ast);
            }
            ast = uglify.ast_mangle(ast, options);
            ast = uglify.ast_squeeze(ast, options);
            return uglify.gen_code(ast);
        }
    };
});