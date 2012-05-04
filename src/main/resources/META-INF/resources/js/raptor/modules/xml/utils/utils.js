raptor.defineModule(
    'xml.utils',
    function(raptor) {
        var extend = raptor.extend,
            specialRegExp = /(\n|\"|[&<>]|[^\u0020-\}])/g,
            attrReplacements = {
                '<': "&lt;",
                '>': "&gt;",
                '&': "&amp;",
                '"': "&quot;",
                '\n': "&#" + "\n".charCodeAt(0) + ";"
            },
            elReplacements = extend(extend({}, attrReplacements), {
                "\n": "\n" 
            }),
            escapeXml = function(str, replacements) {
                if (str == null) return null;
                if (typeof str !== "string") {
                    return str;
                }
                
                return str.replace(specialRegExp, function(match) {
                    var replacement = replacements[match];
                    return replacement || ("&#" + match.charCodeAt(0) + ";");
                });
            };
        
        return {
            escapeXml: function(str) {
                return escapeXml(str, elReplacements);
            },
            
            escapeXmlAttr: function(str) {
                if (!str) {
                    return str;
                }
                return escapeXml('' + str, attrReplacements);
            }
        };
    });