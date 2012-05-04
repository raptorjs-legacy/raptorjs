
// ES5 15.5.4.20
if (!String.prototype.trim) {
        String.prototype.trim = function trim() {
                return String(this).replace(/^\s\s*/,'').replace(/\s\s*$/,'');
        };
}

