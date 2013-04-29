define(
    'test/optimizer/filters/CSSFilter2',
    function(require) {
        return {
            filter: function(code, contentType, context) {
                if (contentType === 'text/css') {
                    return code + '-CSSFilter2';
                }
            }
        };
            
    })