require('./_helper.js');

describe('xml.sax.objectMapper module', function() {

    it('should allow simple types', function() {
        var xml = "<root><string>Hello World</string><myBoolean>true</myBoolean></root>";
        var obj = raptor.require('xml.sax.objectMapper').read(
            xml, 
            'test', 
            {
                "<root>": {
                    _type: "object",
                    "<string>": {
                        _type: "string"
                    },
                    "<myBoolean>": {
                        _type: "boolean"
                    }
                }
            },
            {
                
            });
        
        expect(obj.string).toEqual("Hello World");
        expect(obj.myBoolean).toStrictlyEqual(true);
    });

    it('should allow _targetProp', function() {
        var xml = "<root><string>Hello World</string></root>";
        var obj = raptor.require('xml.sax.objectMapper').read(
            xml, 
            'test', 
            {
                "<root>": {
                    _type: "object",
                    "<string>": {
                        _type: "string",
                        _targetProp: "myString"
                    }
                }
            },
            {
                
            });
        expect(obj.string).toEqual(null);
        expect(obj.myString).toEqual("Hello World");
    });
    
    it('should allow custom setters', function() {
        var xml = "<root><string>Hello World</string></root>",
            root = {},
            foundSetArgs;
        
        var obj = raptor.require('xml.sax.objectMapper').read(
            xml, 
            'test', 
            {
                "<root>": {
                    _type: "object",
                    _begin: function() {
                        return root;
                    },
                    "<string>": {
                        _type: "string",
                        _set: function(parent, name, value, context) {
                            foundSetArgs = arguments;
                            parent.myString = value;
                        }
                    }
                }
            },
            {
                
            });
        expect(foundSetArgs.length).toEqual(4);
        expect(foundSetArgs[0]).toEqual(root);
        expect(foundSetArgs[1]).toEqual("string");
        expect(foundSetArgs[2]).toEqual("Hello World");
        expect(foundSetArgs[3].el.getLocalName()).toEqual("string");
        expect(obj.string).toEqual(null);
        expect(obj.myString).toEqual("Hello World");
    });
    
    it('should allow custom objects to be returned', function() {
        var xml = "<root><string>Hello World</string></root>";
        var obj = raptor.require('xml.sax.objectMapper').read(
            xml, 
            'test', 
            {
                "<root>": {
                    _type: "object",
                    _begin: function() {
                        return {
                            customProp: true
                        };
                    },
                    "<string>": {
                        _type: "string"
                    }
                }
            },
            {
                
            });
        expect(obj.customProp).toEqual(true);
        expect(obj.string).toEqual("Hello World");
    });
    
    it('should allow elements to be skipped', function() {
        var xml = "<root><string>Hello World</string></root>";
        var reader = raptor.require('xml.sax.objectMapper').createReader(
            {
                "<root>": {
                    _type: "object",
                    _begin: function() {
                        reader.skipCurrentElement();
                        return {
                            customProp: true
                        };
                    },
                    "<string>": {
                        _type: "string"
                    }
                }
            },
            {
                //Options
            });
        var obj = reader.read(
            xml, 
            'test');
        
        expect(obj.customProp).toEqual(true);
        expect(obj.string).toEqual(null);
    });
    
    it('should allow nested objects', function() {
        var xml = "<root><object><string>Hello World</string></object></root>";
        
        var root = {},
            nested = {
                nested: true
            },
            foundRootArgs,
            foundNestedArgs,
            foundEndRootArgs,
            foundEndNestedArgs;
        
        var reader = raptor.require('xml.sax.objectMapper').createReader(
            {
                "<root>": {
                    _type: "object",
                    _begin: function(parent, context) {
                        foundRootArgs = arguments;
                        return root;
                    },
                    _end: function(object, parent, context) {
                        foundEndRootArgs = arguments;
                    },
                    "<object>": {
                        _type: "object",
                        _targetProp: "object",
                        _begin: function(parent, context) {
                            foundNestedArgs = arguments;
                            
                            return nested;
                        },
                        _end: function(object, parent, context) {
                            foundEndNestedArgs = arguments;
                        },
                        "<string>": {
                            _type: "string"
                        }
                    }
                }
            },
            {
                //Options
            });
        var returnedRoot = reader.read(
            xml, 
            'test');
        
        expect(foundRootArgs.length).toEqual(2);
        expect(foundRootArgs[0]).toEqual(null);
        expect(foundRootArgs[1].el.getLocalName()).toEqual("root");
        
        expect(foundNestedArgs.length).toEqual(2);
        expect(foundNestedArgs[0]).toEqual(root);
        expect(foundNestedArgs[1].el.getLocalName()).toEqual("object");
        
        expect(foundEndRootArgs.length).toEqual(3);
        expect(foundEndRootArgs[0]).toStrictlyEqual(root);
        expect(foundEndRootArgs[1]).toEqual(null);
        expect(foundEndRootArgs[2].el.getLocalName()).toEqual("root");
        
        expect(foundEndNestedArgs.length).toEqual(3);
        expect(foundEndNestedArgs[0]).toStrictlyEqual(nested);
        expect(foundEndNestedArgs[1]).toEqual(root);
        expect(foundEndNestedArgs[2].el.getLocalName()).toEqual("object");
        
        expect(returnedRoot).toStrictlyEqual(root);
        expect(returnedRoot.object).toStrictlyEqual(nested);
        expect(returnedRoot.object.string).toStrictlyEqual("Hello World");
    });
    
    
    it('should allow attribute handlers', function() {
        var xml = '<root myAttr="true"></root>';

        var reader = raptor.require('xml.sax.objectMapper').createReader(
            {
                "<root>": {
                    _type: "object",
                    "@myAttr": {
                        _type: "boolean"
                    }
                }
            },
            {
                //Options
            });
        var returnedRoot = reader.read(
            xml, 
            'test');
        
        expect(returnedRoot.myAttr).toStrictlyEqual(true);
        expect(typeof returnedRoot.myAttr).toStrictlyEqual("boolean");
    });
    
    it('should allow properties as both attributes and elements', function() {

        var reader = raptor.require('xml.sax.objectMapper').createReader(
            {
                "<root>": {
                    _type: "object",
                    "myProp": {
                        _type: "string"
                    }
                }
            },
            {
                //Options
            });
        var returnedRoot = reader.read(
            '<root myProp="Hello World"></root>', 
            'test');
        
        expect(returnedRoot.myProp).toStrictlyEqual("Hello World");
        
        returnedRoot = reader.read(
            '<root><myProp>Hello World</myProp></root>',
            'test');
            
        expect(returnedRoot.myProp).toStrictlyEqual("Hello World");
        
    });
    
    it('should allow property parsers', function() {
        var xml = '<root myAttr="myattr">mytext<nested anotherAttr="anotherAttr">moretext</nested></root>',
            foundParsePropArgs = [];

        var reader = raptor.require('xml.sax.objectMapper').createReader(
            {
                "<root>": {
                    _type: "object",
                    _setText: function(parent, text) {
                        parent.rootText = text;
                    },
                    "@myAttr": {
                        _type: "string"
                    },
                    "<nested>": {
                        _type: "object",
                        _targetProp: "nested",
                        
                        "@anotherAttr":{
                            _type: "string"
                        },
                        _text: {
                            _targetProp: "moreText",
                            _type: "string"
                        }
                    }
                }
            },
            {
                parseProp: function(value, context) {
                    foundParsePropArgs.push(raptor.arrayFromArguments(arguments));
                    
                    
                    return value.toUpperCase();
                }
                //Options
            });
        var returnedRoot = reader.read(
            xml, 
            'test');
        
        expect(returnedRoot.rootText).toEqual("MYTEXT");
        expect(returnedRoot.myAttr).toEqual("MYATTR");
        expect(returnedRoot.nested.anotherAttr).toEqual("ANOTHERATTR");
        expect(returnedRoot.nested.moreText).toEqual("MORETEXT");
        expect(foundParsePropArgs.length).toEqual(4);
        
    });
    
    it('should allow begin for simple types', function() {
        var xml = "<root><object><string></string></object></root>";
        var root = {};
        
        var obj = raptor.require('xml.sax.objectMapper').read(
            xml, 
            'test', 
            {
                "<root>": {
                    _type: "object",
                    _begin: function() {
                        return root;
                    },
                    "<object>": {
                        _type: "object",
                        _begin: function() {
                            return {
                                
                            };
                        },
                        _end: function(object, parent) {
                            parent.object = object;
                        },
                        "<string>": {
                            _type: "string",
                            _begin: function(parent) {
                                parent.uri = '';
                            }
                        }    
                    }
                }
            },
            {
                
            });
        
        expect(root.object.uri).toStrictlyEqual('');
        
    });
    
    it('should allow begin for simple types', function() {
        var xml = '<root><object a="true"><nested-object b="b" c="c"/></object></root>';
        var root = {isRoot: true};
        
        var returnedRoot = raptor.require('xml.sax.objectMapper').read(
            xml, 
            'test', 
            {
                "<root>": {
                    _type: "object",
                    _begin: function() {
                        return root;
                    },
                    "<object>": {
                        _type: "object",
                        _targetProp: "object",
                        "a": {
                            _type: "boolean",
                            _targetProp: "myA",
                            _set: function(parent, name, value) {
                                parent[name] = value;
                            }
                        },
                        "<nested-object>": {
                            _type: "object",
                            _end: function(nestedObj) {
                                root.nestedObject = nestedObj;
                            },
                            "b": {
                                type: "string"
                            },
                            "c": {
                                type: "string"
                            }
                        }
                    }
                }
            },
            {
                
            });
        
        expect(returnedRoot).toStrictlyEqual(root);
        expect(root.object.myA).toEqual(true);
        expect(root.nestedObject.b).toEqual("b");
        expect(root.nestedObject.c).toEqual("c");
        
    });
});