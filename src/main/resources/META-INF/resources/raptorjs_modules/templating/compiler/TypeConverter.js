raptor.defineClass(
    'templating.compiler.TypeConverter',
    function(raptor) {
        
        var ExpressionParser = raptor.require('templating.compiler.ExpressionParser'),
            stringify = raptor.require('json.stringify').stringify,
            Expression = raptor.require('templating.compiler.Expression');
        
        var TypeConverter = function() {
            
        };
        
        TypeConverter.convert = function(value, targetType, allowExpressions) {
            
            
            var hasExpression = false,
                expressionParts = [];
            
            if (targetType === 'custom' || targetType === 'identifier') {
                return value;
            }
            
            if (targetType === 'expression') {
                return new Expression(value);
            }
            
            if (allowExpressions) {
                ExpressionParser.parse(value, {
                    text: function(text) {
                        expressionParts.push(stringify(text));
                    },
                    
                    expression: function(expression) {
                        expressionParts.push(expression);
                        hasExpression = true;
                    }
                });
                
                if (hasExpression) {
                    return new Expression(expressionParts.join("+"));
                }
            }
            
            if (targetType === 'string') {
                return allowExpressions ? new Expression(value ? stringify(value) : "null") : value;
            }
            else if (targetType === 'boolean') {
                value = value.toLowerCase();
                value = value === 'true' || value === 'yes'; //convert it to a boolean
                return allowExpressions ? new Expression(value) : value;
            }
            else if (targetType === 'float' || targetType === 'double' || targetType === 'number' || targetType === 'integer') {
                if (targetType === 'integer') {
                    value = parseInt(value);
                }
                else {
                    value = parseFloat(value);
                }
                return allowExpressions ? new Expression(value) : value;
            }
            else {
                errors.throwError(new Error("Unsupported attribute targetType: " + targetType));
            }
        };
        
        return TypeConverter;
    });