
if (!Array.isArray) {
        Array.isArray = function isArray(object) {
                return object.constructor == Array;
        };
}

// ES5 15.4.4.14
if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function indexOf(value,from) {
            for (var idx = (from || 0),len = this.length;((idx < len) && (this[idx] !== value));idx++){}
            return (idx < len)?idx:-1;
        };
}

// ES5 15.4.4.15
if (!Array.prototype.lastIndexOf) {
        Array.prototype.lastIndexOf = function lastIndexOf(value,from) {
            for (var idx = (from || (this.length - 1));((idx >= 0) && (this[idx] !== value));idx--){}
            return (idx >= 0)?idx:-1;
        };
}

// ES5 15.4.4.16
if (!Array.prototype.every) {
        Array.prototype.every = function every(func,scope) {
                for (var idx = 0, len = this.length; ((idx < len) && (func.call(scope,this[idx],idx,this) === true));idx++){}
                return (idx >= len);
        };
}

// ES5 15.4.4.17
if (!Array.prototype.some) {
        Array.prototype.some = function some(func,scope) {
                for (var idx = 0,len=this.length;((idx < len) && (func.call(scope,this[idx],idx,this) === false));idx++){}
                return (idx >= len);
        };
}

// ES5 15.4.4.18
if (!Array.prototype.forEach) {
        Array.prototype.forEach =  function forEach(func,scope) {
            for (var idx = 0;(idx < this.length);idx++) func.call(scope,this[idx],idx,this);
        };
}

// ES5 15.4.4.19
if (!Array.prototype.map) {
        Array.prototype.map = function map(func,scope) {
                for (var idx = 0,results = [];(idx < this.length);idx++) {
                    results.push(func.call(scope,this[idx],idx,this));
                }
                return results;
        };
}

// ES5 15.4.4.20
if (!Array.prototype.filter) {
        Array.prototype.filter = function filter(func,scope) {
                for (var idx = 0,results = [];(idx < this.length);idx++) {
                    var result = func.call(scope,this[idx],idx,this);
                    if (result) results.push(this[idx]);
                }
                return results;
        };
}

// ES5 15.4.4.21
if (!Array.prototype.reduce) {
        Array.prototype.reduce = function reduce(func,initial) {
                var args = arguments.length,idx = (args > 1)?0:1,value = idx?this[0]:initial;
                while (idx < this.length) value = func(value,this[idx],idx++,this);
                return value;
        };
}

// ES5 15.4.4.22
if (!Array.prototype.reduceRight) {
        Array.prototype.reduceRight = function reduceRight(func,initial) {
                var args = arguments.length,idx = this.length - 1,value = (args > 1)?initial:this[--idx];
                while (idx >= 0) value = func(value,this[idx],idx--,this);
                return value;
        };
}

