define.Class(
    'taglibs/test/TagWithStaticProps',
    function(require) {
        
        
        var TagWithStaticProps = function() {
            
        };
        
        TagWithStaticProps.prototype = {
            process: function(input, context) {
                context.write(input.prop1 + '(' + (typeof input.prop1) + ')');
                context.write(input.prop2 + '(' + (typeof input.prop2) + ')');
                context.write(input.staticProp1 + '(' + (typeof input.staticProp1) + ')');
                context.write(input.staticProp2 + '(' + (typeof input.staticProp2) + ')');
            }
        };
        
        return TagWithStaticProps;
    });