$rload(function(raptor) {
    var java = __rhinoHelpers.getJava();
    raptor.defineCore('java', {

        convertString: function(str) 
        {
            return str == null ? null : '' + str;
        },
        
        convert: function(value)
        {
            if (value == null) {
                return null;
            }
            else if (java.isString(value))
            {
                value = '' + value;
            } 
            else if (java.isNumber(value))
            {
                value = 0 + value;
            }
            else if (java.isBoolean(value))
            {
                value = value === true;
            } 
            else if (java.isArray(value))
            {
                value = this.convertArray(value);
            } 
            else if (java.isCollection(value))
            {
                value = this.convertCollection(value);
            } 
            else if (java.isMap(value))
            {
                value = this.convertMap(value);
            } 
            else
            {
                value = '' + value;
            }
        },

        convertArray: function(javaArray, convertFunc)
        {
            var out = [];
            
            for (var i=0, len=javaArray.length; i<len; i++)
            {
                out.push(this.convert(javaArray[i]));
            }
            
            return out;
        },
        
        convertCollection: function(javaCollection, convertFunc)
        {
            var out = [];
            var javaIterator = javaCollection.iterator();
            while(javaIterator.hasNext())
            {
                var javaObject = javaIterator.next();
                out.push(this.convert(javaObject));
            }
            return out;
        },
        
        convertMap: function(javaMap, convertFunc)
        {
            var out = {};

            var javaIterator = javaMap.entrySet().iterator();
            while(javaIterator.hasNext())
            {
                var javaEntry = javaIterator.next();
                out['' + javaEntry.getKey()] = this.convert(javaEntry.getValue());
            }
            return out;
        },
        
        getStringInputStream: function(str) {
            return java.getStringInputStream(str);
        }
    });
});