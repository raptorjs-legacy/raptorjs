raptor.defineModule("js-minifier", function() {
    var parser = require("uglify-js").parser;
    var uglify = require("uglify-js").uglify;
    
    return {
        /**
         * Implementation for the minify method that uses uglify internally
         * 
         * Parse options:
         * <ul>
         *  <li>strict_semicolons: false - strict_semicolons is optional and defaults to false. If you pass true then the parser will throw an error when it expects a semicolon and it doesn't find it. For most JS code you don't want that, but it's useful if you want to strictly sanitize your code.
         * </ul>
         * 
         * Minification options:
         * <ul>
         *  <li>lift_variables: (default false) - If true, merge and move var declarations to the scop of the scope; discard unused function arguments or variables; discard unused (named) inner functions. It also tries to merge assignments following the var declaration into it.
         *  <li>make_seqs:(default true) which will cause consecutive statements in a block to be merged using the "sequence" (comma) operator
         *  <li>dead_code: (default true) which will remove unreachable code.
         * </ul>
         * 
         * Code generation options:
         * <ul>
         *  <li>beautify: false - pass true if you want indented output
         *  <li>indent_start: 0 (only applies when beautify is true) - initial indentation in spaces
         *  <li>indent_level: 4 (only applies when beautify is true) - indentation level, in spaces (pass an even number)
         *  <li>quote_keys: false - if you pass true it will quote all keys in literal objects
         *  <li>space_colon: false (only applies when beautify is true) - wether to put a space before the colon in object literals
         *  <li>ascii_only: false - pass true if you want to encode non-ASCII characters as \uXXXX.
         *  <li>inline_script: false - pass true to escape occurrences of </script in strings
         * </li>
         * @param src
         * @param options
         * @returns
         */
        minify: function(src, options) {
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