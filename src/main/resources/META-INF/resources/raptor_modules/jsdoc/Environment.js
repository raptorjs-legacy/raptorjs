raptor.define(
    "jsdoc.Environment",
    function(raptor) {
        "use strict";
        
        var Type = raptor.require('jsdoc.Type'),
            Tag = raptor.require('jsdoc.Tag'),
            File = raptor.require("files").File,
            SymbolSet = raptor.require('jsdoc.SymbolSet');
        
        var Environment = function(symbols) {
            this.symbols = symbols || new SymbolSet();
            this.handlers = raptor.require("listeners").createObservable();
            this.global = new Type("object", "Global");
            this.symbols.addSymbol("global", this.global);
            this.tagTypes = {};
            this.files = {};


            this.registerTagType("param", raptor.require('jsdoc.ParamTag'));
            this.registerTagType("return", raptor.require('jsdoc.ReturnTag'));
            this.registerTagType("borrows", raptor.require('jsdoc.BorrowTag'));
            this.registerTagType("borrow", raptor.require('jsdoc.BorrowTag'));
        };
        
        Environment.prototype = {
            addFile: function(file, sourceDir) {
                var sourceDir = sourceDir.isDirectory() ? sourceDir : sourceDir.getParentFile();
                
                this.files[file.getAbsolutePath()] = {
                    file: file,
                    path: file.getAbsolutePath(),
                    sourceDir: sourceDir,
                    relativePath: file.getAbsolutePath().substring(sourceDir.getAbsolutePath().length),
                    relativeDir: file.getParent().substring(sourceDir.getAbsolutePath().length)
                };
            },

            getSourceDirForFile: function(file) {
                var path;

                if (file instanceof File) {
                    path = file.getAbsolutePath();
                }
                else if (typeof file === 'string') {
                    path = file;
                }

                var entry = this.files[path];
                return entry ? entry.sourceDir : null;
            },

            getGlobal: function() {
                return this.global;
            },
            
            addHandlers: function(handlers, thisObj) {
                this.handlers.subscribe(handlers, thisObj);
            },
            
            registerTagType: function(tagName, TagClass) {
                this.tagTypes[tagName] = TagClass;
            },
            
            parseTag: function(tagName, value) {

                var TagClass = this.tagTypes[tagName],
                    tag = null;

                if (TagClass) {
                    tag = new TagClass(tagName, value);
                }
                
                return tag || new Tag(tagName, value);
            },
            
            publish: function(name, args) {
                this.handlers.publish(name, args);
            },
            
            getSymbols: function() {
                return this.symbols;
            },
            
            setSymbols: function(symbols) {
                this.symbosl = symbols;
            },

            forEachSourceFile: function(callback, thisObj) {
                raptor.forEachEntry(this.files, function(path, fileEntry) {
                    callback.call(thisObj, fileEntry);
                });
            }
        };
        
        return Environment;
        
        
    });