define.Class(
    'taglibs/helper-objects/TestHelper',
    function(require) {
        function TestHelper(context) {
            this.context = context;
            if (!this.context || !this.context.getAttributes) {
                throw new Error('context expected');
            }
        }

        TestHelper.prototype = {
            upperCase: function(str) {
                return str.toUpperCase();
            }
        }

        return TestHelper;
    })