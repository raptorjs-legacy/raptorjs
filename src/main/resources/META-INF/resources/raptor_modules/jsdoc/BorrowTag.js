raptor.define(
    "jsdoc.BorrowTag",
    "jsdoc.Tag",
    function(raptor) {


        

        var BorrowTag = function(name, value) {
            BorrowTag.superclass.constructor.call(this, "borrow", value);

            var borrowFrom = value;
            var borrowFromPropName = null;
            var borrowAs = null;

            var matches = /\s+as\s+(\w+)\s*$/g.exec(borrowFrom);
            if (matches) {
                borrowAs = matches[1];
                borrowFrom = borrowFrom.substring(0, matches.index);
            }

            var propNameSeparator = borrowFrom.lastIndexOf('#');
            if (propNameSeparator == -1) {
                propNameSeparator = borrowFrom.lastIndexOf('.');
            }
            
            if (propNameSeparator === -1) {
                console.error("Invalid borrow: " + value);
                return;
            }

            borrowFromPropName = borrowFrom.substring(propNameSeparator + 1);
            borrowFrom = borrowFrom.substring(0, propNameSeparator);

            this.borrowFrom = borrowFrom;
            this.borrowFromPropName = borrowFromPropName;
            this.borrowAs = borrowAs;

        };

        BorrowTag.prototype = {

        };

        return BorrowTag;
    });