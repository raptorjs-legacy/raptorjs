raptor.defineClass(
    'templating.compiler.Expression',
    function() {
       
        var Expression = function(expression) {
            this.expression = expression;
        };
        
        Expression.prototype = {
            /**
             * 
             * @returns
             */
            getExpression: function() {
                return this.expression;
            },
            
            /**
             */
            toString: function() {
                return this.expression;
            }
        };
        
        return Expression;
    });