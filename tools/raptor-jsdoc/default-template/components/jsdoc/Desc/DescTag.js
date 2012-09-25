raptor.define(
    "components.jsdoc.Desc.DescTag",
    function(raptor) {
        
        var jsdocUtil = raptor.require("jsdoc-util"),
            templating = raptor.require('templating'),
            strings = raptor.require('strings'),
            Type = raptor.require('jsdoc.Type');
        
        /**s Find symbol {@link ...} strings in text and turn into html links */
        var resolveLinks = function(str, context) {
            if (!str) return str;
            
            str = str.replace(/\{@link\s*([^}]+)\s*\}/gi,
                function(match, symbolName) {
                    var link = jsdocUtil.symbolLink(symbolName);
                    if (link) {
                        return link.href ? ('<a href="' + link.href + '">' + link.label + '</a>') : link.label;
                    }
                }
            );
            
            return str;
        }

        var codeTags = {
                "html": "sh_html",
                "xml": "sh_xml",
                "javascript": "sh_javascript_dom",
                "js": "sh_javascript_dom"
        };

        var syntaxHighlighting = function(desc) {
            
            desc = desc.replace(/<(html|javascript|js|xml)>((?:.|\n|\r|\t)*?)<\/(html|javascript|js|xml)>/g, function(match, tagBegin, body, tagEnd) {
                var targetClass = codeTags[tagBegin];
                if (targetClass && (tagBegin == tagEnd)) {
                    return '<pre class="code ' + targetClass + '">' + body.replace(/</g, '&lt;') + "</pre>";
                }
                else {
                    return match;
                }
            });

            return desc;
        }

        var Desc = function(config) {
            
        };
        
        Desc.prototype = {
            process: function(input, context) {
                var desc = input.value;
                if (!desc) {
                    return;
                }

                desc = resolveLinks(desc, context);
                desc = syntaxHighlighting(desc);

                templating.render("components/jsdoc/Desc", {
                    desc: desc,
                }, context);
            }
        };
        
        return Desc;
    });