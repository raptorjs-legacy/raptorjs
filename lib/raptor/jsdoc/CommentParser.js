define("raptor/jsdoc/CommentParser", function(require, exports, module) {
    'use strict';
    
    var Comment = require('raptor/jsdoc/Comment'),
        Tag = require('raptor/jsdoc/Tag'),
        strings = require('raptor/strings');

    var CommentParser = function(env) {
        this.env = env;
    };

    CommentParser.prototype = {
        parse : function(text) {
            var comment = new Comment(text);

            text = text.replace(/^\s*\/\*/, '').replace(/\*\/\s*$/, '').replace(/$\s*\/\//g, '');

            var lines = text.split(/\r\n|\r|\n/);

            var description = [],
                curTagLines = null,
                curTagName = null,
                env = this.env,
                endTag = function() {
                    
                    if (curTagName != null) {
                        var value = curTagLines.join('\n').replace(/\s*\n\s*/g, ' ');
                        var tag = env ? env.parseTag(curTagName, value) : new Tag(curTagName, value);
                        comment.addTag(tag);
                    }
                    
                    curTagName = null;
                    curTagLines = null;
                };

            lines.forEach(function(line) {
                line = line.replace(/\s*\*[ ]?/g, '');
                if (line.trim() === '') {
                    if (curTagName) {
                        //We found an empty line... end the current tag
                        endTag();    
                    }
                    else {
                        description.push(line);
                    }
                }
                else if (/^\s*\@/.test(line)) {
                    line = strings.ltrim(line);
                    endTag();
                    // Found a tag
                    var tagEnd = line.indexOf(' ');
                    if (tagEnd === -1) {
                        tagEnd = line.length;
                        curTagLines = [];
                    } else {
                        curTagLines = [line.substring(tagEnd + 1)];
                    }
                    curTagName = line.substring(1, tagEnd);
                } else {
                    // Found a non-tag line
                    if (curTagName) {
                        curTagLines.push(line);
                    }
                    else {
                        
                        description.push(line);
                    }
                }

            }, this);
            
            endTag();
            
            description = description.join('\n').trim();
            if (description.length) {
                comment.setDescription(description);    
            }
            
            return comment;
        }
    };

    return CommentParser;

});