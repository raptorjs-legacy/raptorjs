define(
    "raptor/jsdoc/Comment",
    function(require, exports, module) {
        'use strict';
        
        var logger = module.logger();
        
        var Comment = function(text) {
            this.text = null;
            this.description = null;
            this.tags = {};
            this.setText(text);
        };
        
        Comment.prototype = {
            setText: function(text) {
                this.text = text;
            },
            
            getText: function() {
                return this.text;
            },
            
            addTags: function(tags) {
                if (tags && tags.length) {
                    tags.forEach(function(tag) {
                        this.addTag(tag);
                    }, this);
                }
            },
            
            addTag: function(tag) {
                
                if (arguments.length === 2) {
                    var Tag = require('raptor/jsdoc/Tag');
                    tag = new Tag(arguments[0], arguments[1]);
                }
                
                var tagsForName = this.tags[tag.name] || (this.tags[tag.name] = []);
                tagsForName.push(tag);
            },
            
            hasTag: function(name) {
                return this.tags.hasOwnProperty(name);
            },
            
            getTag: function(name) {
                var tagsForName = this.tags[name];
                if (tagsForName) {
                    if (tagsForName.length > 1) {
                        logger.warn('Multiple tags found with name "' + name + '": [' + tagsForName.map(function(tag) {
                            return tag.text;
                        }).join(", ") + "]");
                    }
                    return tagsForName[tagsForName.length-1];
                }
                else {
                    return null;
                }
            },
            
            getTagValue: function(name) {
                var tag = this.getTag(name);
                return tag ? tag.getValue() : null;
            },
            
            getTags: function(name) {
                var tagsForName = this.tags[name];
                return tagsForName || [];
            },
            
            getDescription: function() {
                var descTag = this.getTag('description');
                return (descTag ? descTag.getValue() : this.description) || '';
            },
            
            setDescription: function(desc) {
                this.description = desc;
            }
        };
        
        return Comment;
        
        
    });