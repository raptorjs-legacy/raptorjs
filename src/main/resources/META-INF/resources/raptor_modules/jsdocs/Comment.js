raptor.define(
    "jsdocs.Comment",
    function(raptor) {
        "use strict";
        
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
                        this.logger().warn('Multiple tags found with name "' + name + '": [' + tagsForName.map(function(tag) {
                            return tag.text;
                        }).join(", ") + "]");
                    }
                    return tagsForName[tagsForName.length-1];
                }
                else {
                    return null;
                }
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