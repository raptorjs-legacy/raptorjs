require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe('templating module', function() {
    var logger = require('raptor/logging').logger('raptor-templating-spec'),
        compileAndLoad = helpers.templating.compileAndLoad,
        compileAndRender = helpers.templating.compileAndRender;
    
    it("should allow appending child nodes", function() {
        var Node = require('raptor/templating/compiler/Node');
        var root = new Node();
        root.setRoot(true);
        
        var firstChild = new Node();
        root.appendChild(firstChild);
        expect(firstChild.parentNode).toEqual(root);
        expect(firstChild).toEqual(root.firstChild);
        expect(firstChild).toEqual(root.lastChild);
        expect(firstChild.nextSibling).toEqual(null);
        expect(firstChild.previousSibling).toEqual(null);
        
        var secondChild = new Node();
        root.appendChild(secondChild);
        expect(secondChild.parentNode).toEqual(root);
        expect(firstChild).toEqual(root.firstChild);
        expect(secondChild).toEqual(root.lastChild);
        
        var newFirstChild = new Node();
        root.replaceChild(newFirstChild, firstChild);
        
        expect(firstChild.parentNode).toEqual(null);
        expect(secondChild.parentNode).toEqual(root);
        expect(newFirstChild).toEqual(root.firstChild);
        expect(secondChild).toEqual(root.lastChild);
        expect(newFirstChild.nextSibling).toEqual(secondChild);
        expect(secondChild.previousSibling).toEqual(newFirstChild);
        expect(newFirstChild.previousSibling).toEqual(null);
    });
    
    it("should allow expressions to be parsed", function() {
        var ExpressionParser = require('raptor/templating/compiler/ExpressionParser');
        
        var parts = [],
            parseCallback = {
                text: function(text) {
                    parts.push({text: text});
                },
                
                expression: function(expression) {
                    parts.push({expression: expression.toString()});
                }
            },
            getText = function(i) {
                if (i < parts.length) {
                    if (parts[i].hasOwnProperty('text')) {
                        return parts[i].text || "(EMPTY)";
                    }
                    else {
                        return parts[i].expression + " (EXPRESSION)";
                    }
                }
                else {
                    return null;
                }
                
            },
            getExpression = function(i) {
                if (i < parts.length) {
                    if (parts[i].hasOwnProperty('expression')) {
                        return parts[i].expression || "(EMPTY)";
                    }
                    else {
                        return parts[i].text + " (TEXT)";
                    }
                }
                else {
                    return undefined;
                }
                
            },
            parse = function(str) {
                parts = [];
                ExpressionParser.parse(str, parseCallback);
                //console.log("Parse Result.\nInput: ", str, "\nOutput:\n", parts);
            };
            
        
        parse("hello ${a} world");
        expect(parts.length).toEqual(3);
        expect(getText(0)).toEqual("hello ");
        expect(getExpression(1)).toEqual("a");
        expect(getText(2)).toEqual(" world");
        
        parse("hello {a} world"); //NOTE: The actual string will be "hello \{a} world" since the escape had to be escaped
        expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual("hello {a} world");
        
        parse("hello \\${a} world"); //NOTE: The actual string will be "hello \{a} world" since the escape had to be escaped
        expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual("hello ${a} world");
        
        parse("hello world");
        expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual("hello world");
        
        parse("hello ${'{a}'} world");
        expect(parts.length).toEqual(3);
        expect(getText(0)).toEqual("hello ");
        expect(getExpression(1)).toEqual("'{a}'");
        expect(getText(2)).toEqual(" world");
        
        parse('hello ${"{a}"} world');
        expect(parts.length).toEqual(3);
        expect(getText(0)).toEqual("hello ");
        expect(getExpression(1)).toEqual('"{a}"');
        expect(getText(2)).toEqual(" world");

        parse('$a');
        expect(parts.length).toEqual(1);
        expect(getExpression(0)).toEqual('a');
        
        parse('\\$a');
        expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual('$a');
        
        parse('${a}');
        expect(parts.length).toEqual(1);
        expect(getExpression(0)).toEqual('a');
        
        parse('${a} ${b}');
        expect(parts.length).toEqual(3);
        expect(getExpression(0)).toEqual('a');
        expect(getText(1)).toEqual(" ");
        expect(getExpression(2)).toEqual('b');
        
        parse('${a} ${b}');
        expect(parts.length).toEqual(3);
        expect(getExpression(0)).toEqual('a');
        expect(getText(1)).toEqual(" ");
        expect(getExpression(2)).toEqual('b');
        
        parse('\\\\{1}');
        expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual("\\\\{1}");
        
        parse('\\\\${1}');
        expect(parts.length).toEqual(2);
        expect(getText(0)).toEqual("\\");
        expect(getExpression(1)).toEqual('1');
        
        parse('${{}}');
        expect(parts.length).toEqual(1);
        expect(getExpression(0)).toEqual("{}");

        parse("${entity:lt}DIV${entity:gt}\n    ${startTag:div}Hello${endTag:div}");
        expect(parts.length).toEqual(7);
        expect(getText(0)).toEqual('&lt;');
        expect(getText(1)).toEqual('DIV');
        expect(getText(2)).toEqual('&gt;');
        expect(getText(3)).toEqual('\n    ');
        expect(getText(4)).toEqual('<div>');
        expect(getText(5)).toEqual('Hello');
        expect(getText(6)).toEqual('</div>');
        
        parse('AAAA \\${1} BBBB \\\\${1} CCCC \\${1} DDDD \\\\${1}');
        expect(parts.length).toEqual(4);
        expect(getText(0)).toEqual("AAAA ${1} BBBB \\");
        expect(getExpression(1)).toEqual("1");
        expect(getText(2)).toEqual(" CCCC ${1} DDDD \\");
        expect(getExpression(3)).toEqual("1");
        
        
        parse('A \\\\${1} C');
        //expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual("A \\");
        expect(getExpression(1)).toEqual("1");
        expect(getText(2)).toEqual(" C");
        
        
        parse('A \\${1} \\\\${1} C');
        //expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual("A ${1} \\");
        expect(getExpression(1)).toEqual("1");
        expect(getText(2)).toEqual(" C");
        
        parse('C \\${1}');
        expect(getText(0)).toEqual("C ${1}");
        
        
        
//        parse('\\\\{1}');
//        expect(parts.length).toEqual(1);
//        expect(getText(0)).toEqual("\{1}");
        
    });
    
    it("should allow for attribute splitting", function() {
        var AttributeSplitter = require('raptor/templating/compiler/AttributeSplitter');
        var result;
        
        result = AttributeSplitter.parse(
            "item in ['one', 'two', 'three']; separator=', '; status-var=loop;  ",
            {
                each: {
                    type: "custom"
                },
                separator: {
                    type: "expression"
                },
                "status-var": {
                    type: "custom"
                }
            },
            {
                defaultName: "each"
            });
        
        expect(Object.keys(result).length).toEqual(3);
        expect(result["each"]).toEqual("item in ['one', 'two', 'three']");
        expect(result["separator"].getExpression()).toEqual("', '");
        expect(result["status-var"]).toEqual("loop");
        
        //////
        result = AttributeSplitter.parse(
            "item in ['one', 'two', 'three']",
            {
                each: {
                    type: "custom"
                },
                
                separator: {
                    type: "expression"
                }
            },
            {
                defaultName: "each"
            });
        
        expect(Object.keys(result).length).toEqual(1);
        expect(result["each"]).toEqual("item in ['one', 'two', 'three']");
        
        //////
        result = AttributeSplitter.parse(
            "each=item in ['one', 'two', 'three']",
            {
                each: {
                    type: "custom"
                },
                separator: {
                    type: "expression"
                }
            },
            {
                defaultName: "each"
            });
        
        expect(Object.keys(result).length).toEqual(1);
        expect(result["each"]).toEqual("item in ['one', 'two', 'three']");
        
        //////
        result = AttributeSplitter.parse(
            "each=item in (a = [1,2,3])",
            {
                each: {
                    type: "custom"
                },
                separator: {
                    type: "expression"
                }
            },
            {
                defaultName: "each"
            });
        
        expect(Object.keys(result).length).toEqual(1);
        expect(result["each"]).toEqual("item in (a = [1,2,3])");
    });

    it("should allow for text replacement", function() {
        var output = compileAndRender("/test-templates/text-replacement.rhtml", {
            person: {
                name: "John",
                address: {
                    city: "San Jose",
                    state: "CA",
                    line1: "2065 E. Hamilton Ave.",
                    zip: "95125"
                }
            }
        });
        expect(output).toEqual('Hello John. You are from San Jose, CA');
    });

    
    it("should allow for escaping XML", function() {
        var escapeXml = require("raptor/xml/utils").escapeXml;
        expect(escapeXml('"-&')).toEqual('"-&amp;');
        
        var escapeXmlAttr = require("raptor/xml/utils").escapeXmlAttr;
        expect(escapeXmlAttr('"-&')).toEqual('&quot;-&amp;');
    });
    
    it("should allow a simple template to be compiled", function() {
        var output = compileAndRender("/test-templates/simple.rhtml", {message: "Hello World!", rootClass: "title", colors: ["red", "green", "blue"]});
        expect(output).toEqual('<div class="hello-world title">Hello World!</div><ul><li class="color">red</li><li class="color">green</li><li class="color">blue</li></ul>');
    });
    
    
    it("should allow for simple template handlers", function() {
        var output = compileAndRender("/test-templates/simple-handlers.rhtml", {dynamic: "universe"});
        expect(output).toEqual('<ul><li>Hello world! adult=false</li><li>Hello universe! adult=true</li><li>Hello Dynamic: universe! adult=false</li></ul>');
    });
    
    it("should allow for template handlers with nested body content", function() {
        var output = compileAndRender("/test-templates/nested-handlers.rhtml", {showConditionalTab: false});
        expect(output).toEqual('<div class="tabs"><ul class="nav nav-tabs"><li class="active"><a href="#tab0" data-toggle="tab">Tab 1</a></li><li><a href="#tab1" data-toggle="tab">Tab 2</a></li></ul><div class="tab-content"><div id="tab0" class="tab-pane active">Tab 1 content</div><div id="tab1" class="tab-pane">Tab 2 content</div></div></div>');
    });

    it("should allow entity expressions", function() {
        var output = compileAndRender("/test-templates/entities.rhtml", {});
        expect(output).toEqual('<div data-attr="Hello &lt;John&gt; &lt;hello&gt;" data-nested-attr="Hello &lt;John&gt; &lt;hello&gt;" data-nested-attr2="Hello &lt;John&gt; &lt;hello&gt;">Hello &lt;John>© &lt;hello> <START></div>');
    });
    
    it("should allow escaped expressions", function() {
        var output = compileAndRender("/test-templates/escaped.rhtml", {});
        expect(output).toEqual('VV {1} XX \\{1} YY ${1} ZZ \\1');
    });
    
    it("should allow complex expressions", function() {
        var output = compileAndRender("/test-templates/expressions.rhtml", {});
        expect(output).toEqual('Hello World!');
    });
    
    it("should allow whitespace to be removed", function() {
        var output = compileAndRender("/test-templates/whitespace.rhtml", {});
        expect(output).toEqual("BEGIN  this whitespace   should be retained   END test hello Long paragraph of text should retain spacing between lines. <ul><li>One</li><li>Two</li></ul><a href=\"Test\">Hello World!</a><pre>\n   begin      end     \n</pre><div>\n   begin      end     \n</div><div>\n   begin      end     \n</div>begin end");
    });
    
    it("should handle whitespace when using expressions", function() {
        var output = compileAndRender("/test-templates/whitespace2.rhtml", {});
        expect(output).toEqual("A B C");
    });
    
    it("should handle whitespace when using expressions", function() {
        var output = compileAndRender("/test-templates/whitespace2.rhtml", {});
        expect(output).toEqual("A B C");
    });
    
    it("should normalize whitespace", function() {
        var output = compileAndRender("/test-templates/whitespace3.rhtml", {});
        expect(output).toEqual(" A B C ");
    });
    
    it("should handle whitespace correctly for mixed text and element children", function() {
        var output = compileAndRender("/test-templates/whitespace-inline-elements.rhtml", {});
        expect(output).toEqual('<p>A <i>B</i> C</p> --- <p>D <i>E</i> F</p> --- <p>G <i>H</i> I</p> --- <p>J <div>K</div> L <div>M</div> N</p> --- <p><div>O</div><div>P</div><span>Q</span> <span>R</span> </p>');
    });
    
    it("should allow HTML output that is not well-formed XML", function() {
        var output = compileAndRender("/test-templates/html.rhtml", {});
        expect(output).toEqual('<img src="test.jpg"><div class="self-closing-not-allowed"></div><script src="test.js"></script><br>');
    });
    
    it("should allow for looping", function() {
        var output = compileAndRender("/test-templates/looping.rhtml", {});
        expect(output).toEqual('abca - true - false - 0 - 3, b - false - false - 1 - 3, c - false - true - 2 - 3<div>red - true - false - 0 - 3</div>, <div>green - false - false - 1 - 3</div>, <div>blue - false - true - 2 - 3</div>');
    });

    it("should allow for looping over properties", function() {
        var output = compileAndRender("/test-templates/looping-props.rhtml", {});
        expect(output).toEqual('[foo=low][bar=high]<ul><li>[foo=low]</li><li>[bar=high]</li></ul>');
    });
    
    it("should allow for dynamic attributes", function() {
        var output = compileAndRender("/test-templates/attrs.rhtml", {"myAttrs": {style: "background-color: #FF0000; <test>", "class": "my-div"}});
        expect(output).toEqual('<div data-encoding="&quot;hello&quot;" style="background-color: #FF0000; &lt;test&gt;" class="my-div">Hello World!</div>');
    });
    
    it("should allow for choose...when statements", function() {
        var output = compileAndRender("/test-templates/choose-when.rhtml", {});
        expect(output).toEqual('TRUE, TRUE');
    });
    
    it("should not allow <c:otherwise> to be before a <c:when> tag", function() {
        
        var e;
        try
        {
            compileAndRender("/test-templates/choose-when-invalid-otherwise-not-last.rhtml", {}, null /*context*/, true /* invalid */);
        }
        catch(_e) {
            e = _e;
        }
        
        expect(e).toNotEqual(null);
    });
    
    it("should allow for <c:def> functions", function() {
        var output = compileAndRender("/test-templates/def.rhtml", {});
        expect(output).toEqual('<p class="greeting">Hello, World!</p>, <p class="greeting">Hello, Frank!</p><div class="section"><h1><a href="http://www.ebay.com/">ebay</a></h1><p><i>Visit eBay</i></p></div>');
    });
    
    it("should allow for <c:with> functions", function() {
        var output = compileAndRender("/test-templates/with.rhtml", {});
        expect(output).toEqual('1 7 11<div>1) hello</div><div>2) hello</div><div>3) hello</div>');
    });
    
    it("should allow for scriptlets", function() {
        var output = compileAndRender("/test-templates/scriptlet.rhtml", {});
        expect(output).toEqual(' HELLO ');
    });
    
    it("should allow for when and otherwise as attributes", function() {
        var output = compileAndRender("/test-templates/choose-when-attributes.rhtml", {});
        expect(output).toEqual('<div id="one"><div>TRUE</div></div><div id="two"><div>TRUE</div></div>');
    });
    
    it("should allow for elements to be stripped out at compile time", function() {
        var output = compileAndRender("/test-templates/strip.rhtml", {});
        expect(output).toEqual('<div><b>A</b></div><div><span><b>B</b></span></div><div><b>c</b></div><div><span><b>d</b></span></div>');
    });
    
    it("should allow for body content to be replaced with the result of an expression", function() {
        var output = compileAndRender("/test-templates/content.rhtml", {});
        expect(output).toEqual('<div>Hello</div>');
    });
    
    it("should allow for an element to be replaced with the result of an expression", function() {
        var output = compileAndRender("/test-templates/replace.rhtml", {message: "Hello World!"});
        expect(output).toEqual('Hello, Hello World!');
    });
    
    it("should allow for includes", function() {
        var output = compileAndRender("/test-templates/include.rhtml", {});
        expect(output).toEqual('Hello Frank! You have 20 new messages.Hello Frank! You have 20 new messages.Hello Frank! You have 20 new messages.<div class="nested"><h1>Hello Frank! You have 20 new messages.</h1><p>Have a <b>wonderful</b> day!</p></div>');
    });
    
    it("should allow for <c:invoke function... />", function() {
        compileAndLoad("/test-templates/invoke.rhtml");
        
        var output = compileAndRender("/test-templates/invoke.rhtml", {});
        expect(output).toEqual(' A <p>Hello World!Hello World!</p> B <p>Hello Frank! You have 10 new messages.Hello John! You have 20 new messages.</p>');
    });
    
    it("should allow for helper functions", function() {
        var output = compileAndRender("/test-templates/helper-functions-shortname.rhtml", {});
        expect(output).toEqual('Hello WORLD! Hello World!');
        
        output = compileAndRender("/test-templates/helper-functions-uri.rhtml", {});
        expect(output).toEqual('Hello WORLD! Hello World!');
    });
    
    it("should allow for context helper functions", function() {

        var context = require('raptor/templating').createContext();
        context.getAttributes()["loggedInUser"] = {
                firstName: "John",
                lastName: "Doe"
        };
        
        var output = compileAndRender("/test-templates/context-helper-functions-shortname.rhtml", {}, context);
        expect(output).toEqual('Hello John Doe!');
        
        output = compileAndRender("/test-templates/context-helper-functions-uri.rhtml", {}, context);
        expect(output).toEqual('Hello John Doe!');
        
    });
    
    it("should allow for template imports", function() {
        var output = compileAndRender("/test-templates/imports1.rhtml", {showConditionalTab: false});
        expect(output).toEqual('<div class="tabs"><ul class="nav nav-tabs"><li class="active"><a href="#tab0" data-toggle="tab">Tab 1</a></li><li><a href="#tab1" data-toggle="tab">Tab 2</a></li></ul><div class="tab-content"><div id="tab0" class="tab-pane active">Tab 1 content</div><div id="tab1" class="tab-pane">Tab 2 content</div></div></div>');
    });

    it("should allow for template simple imports", function() {
        var output = compileAndRender("/test-templates/imports2.rhtml", {showConditionalTab: false});
        expect(output).toEqual('<div class="tabs"><ul class="nav nav-tabs"><li class="active"><a href="#tab0" data-toggle="tab">Tab 1</a></li><li><a href="#tab1" data-toggle="tab">Tab 2</a></li></ul><div class="tab-content"><div id="tab0" class="tab-pane active">Tab 1 content</div><div id="tab1" class="tab-pane">Tab 2 content</div></div></div>');
    });
    
    it("should allow for context helper functions", function() {
        
        var context = require('raptor/templating').createContext();
        context.getAttributes()["loggedInUser"] = {
                firstName: "John",
                lastName: "Doe"
        };
        
        var output = compileAndRender("/test-templates/imports3.rhtml", {}, context);
        expect(output).toEqual('Hello John Doe!');
        
    });
    
    it("should handle errors correctly", function() {

        
        
        var tryTemplate = function(path, callback) {
            try
            {
                compileAndRender(path, {}, null, true /* invalid */);
                callback("", []);
            }
            catch(e) {
                
                if (!e.errors) {
                    logger.error('Error message for template at path "' + path + '": ' + e, e);
                }
                else {
                    console.log('Error message for template at path "' + path + '": ' + e)
                }
                callback(e.toString(), e.errors);
            }
        };
        
        tryTemplate("/test-templates/errors.rhtml", function(message, errors) {
            var len = errors ? errors.length : -1;
            expect(len).toEqual(25);
            
            
        });
        
        
    });
    
    it("should allow static file includes", function() {

        var output = compileAndRender("/test-templates/include-resource-static.rhtml", {});
        expect(output).toEqual('BEGIN Hello World! END');
    });
    
    it("should allow HTML pages with inline script", function() {

        var output = compileAndRender("/test-templates/inline-script.rhtml", {name: "World"});
        expect(output).toEqual('<html><head><title>Optimizer: Server Includes</title></head><body>Hello World! <script>$(function() { alert(\'test\'); })</script></body></html>');
    });
    
    it("should allow CDATA inside templates", function() {

        var output = compileAndRender("/test-templates/cdata.rhtml", {name: "World"});
        expect(output).toEqual('&lt;hello>');
    });
    
    it("should allow type conversion", function() {
        var TypeConverter = require('raptor/templating/compiler/TypeConverter');
        expect(TypeConverter.convert('${entity:special}', "string", true).toString()).toEqual('"&special;"');
    });
    
    it("should allow for if...else", function() {
        var output = compileAndRender("/test-templates/if-else.rhtml", {});
        expect(output).toEqual('A , B , C , <div>C</div>');
    });
    
    it("should allow for expressions and variables inside JavaScript strings", function() {
        var output = compileAndRender("/test-templates/string-expressions.rhtml", {name: "John", count: 10});
        expect(output).toEqual('Hello JOHN! You have 10 new messages.');
    });
    
    it("should allow for simple conditionals", function() {
        var output = compileAndRender("/test-templates/simple-conditionals.rhtml", {name: "John", count: 51});
        expect(output).toEqual('<div class="over-50"></div><div></div><div class="over-50"></div><div class="#"></div><span class="under;-50\\"></span><input type="checked" checked>Hello John! Over 50');
    });
    
    it("should allow for conditional attributes", function() {
        var output = compileAndRender("/test-templates/conditional-attributes.rhtml", {});
        expect(output).toEqual('<div></div><div class="some-class"></div><div></div>');
    });
    
    it("should allow for dynamic attributes", function() {
        var output = compileAndRender("/test-templates/dynamic-attributes.rhtml", {});
        expect(output).toEqual('test: Hello|dynamic attributes: [class=my-class, id=myId]');
    });
    
    it("should allow for nodes to be converted to expressions", function() {
        var ElementNode = require('raptor/templating/compiler/ElementNode');
        var TextNode = require('raptor/templating/compiler/TextNode');
        var TemplateBuilder = require('raptor/templating/compiler/TemplateBuilder');

        var compiler = require('raptor/templating/compiler').createCompiler();
        var template = new TemplateBuilder(compiler);
        
        var div = new ElementNode("div");
        var text = new TextNode("Hello World!");
        div.appendChild(text);
        
        var expression = div.getExpression(template).toString();
        var bodyContentExpression = div.getBodyContentExpression(template).toString();
        
        var sb = require('raptor/strings').createStringBuilder();
        var context = require('raptor/templating').createContext(sb);
        var output = eval(expression);
        expect(output.toString()).toEqual('<div>Hello World!</div>');
        
        output = eval(bodyContentExpression);
        expect(output.toString()).toEqual('Hello World!');
        
    });
    
    it("should allow for nested tags", function() {
        var output = compileAndRender("/test-templates/nested-tags.rhtml", {});
        expect(output).toEqual('<span title="Popover Title" data-content="Popover Content">Link Text</span><span title="Popover Title" data-content="Popover Content">Link Text</span>');
    });
    
    it("should allow for nested attributes", function() {
        var output = compileAndRender("/test-templates/nested-attrs.rhtml", {active: true});
        expect(output).toEqual('<span title="Popover Title" data-content="Popover Content">Link Text</span><div class="tab-active" align="center"></div><div title=" red!  green!  blue! "></div>');
    });
    
    it("should allow for new variables to be created and assigned values", function() {
        var output = compileAndRender("/test-templates/var.rhtml", {active: true});
        expect(output).toEqual('<div>red</div><div>green</div><div>blue</div><div>orange</div><div>purple</div><div>yellow</div>');
    });
    
    
    it("should handle XML escaping correctly", function() {
        var output = compileAndRender("/test-templates/xml-escaping.rhtml", {name: "<Patrick>", welcome: '<span>Welcome</span>'});
        //console.error(JSON.stringify(output));
        expect(output).toEqual("<span>Welcome</span><span>Welcome</span><span>Welcome</span> &lt;Patrick><div title=\"&lt;span&gt;Welcome&lt;/span&gt; &lt;hello&gt;\" data-name=\"&lt;Patrick&gt;\"></div><div data-attr=\"Hello &lt;Patrick&gt; &lt;hello&gt;\" data-nested-attr=\"&lt;Hello&gt; &lt;Patrick&gt; &lt;hello&gt;\" data-nested-attr2=\"Hello &lt;John&gt; &lt;hello&gt;\">Hello &lt;John>© &lt;hello> <START></div>");
    });
    
    it("should allow for a doctype tag and a doctype attribute", function() {
        var output = compileAndRender("/test-templates/doctype.rhtml", {});
        expect(output).toEqual("<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.01 Transitional//EN\" \"http://www.w3.org/TR/html4/loose.dtd\"><!DOCTYPE html><html><head><title>DOCTYPE Test</title></head><body></body></html>");
    });

    it("should allow for using templates to render custom tags", function() {
        var output = compileAndRender("/test-templates/template-as-tag.rhtml", {title: "My Page Title"});
        expect(output).toEqual('<div><h1>My Page Title</h1></div>');
    });

    it("should allow for caching HTML fragments", function() {
        var output = compileAndRender("/test-templates/caching.rhtml", {});
        expect(output).toEqual('Count: 0Count: 0Count: 1Count: 2Count: 2Count: 3');
    });

    it("should allow for using templates to render custom tags", function() {
        var output = compileAndRender("/test-templates/taglib-alias.rhtml", {});
        expect(output).toEqual('Hello John! adult=trueHello John! adult=trueHello John! adult=true');
    });
    
    xit("should allow for widgets", function() {
        compileAndLoad("/test-templates/widgets_nested.rhtml");
        
        var output = compileAndRender("/test-templates/widgets.rhtml", {});
        console.error(JSON.stringify(output));
        expect(output).toEqual('<div id="one"><div>TRUE</div></div>,<div id="two"><div>TRUE</div></div>');
    });

    it("should escape XML in text node when enabled", function() {
        var output = compileAndRender("/test-templates/escape-xml-enabled.rhtml", {});
        expect(output).toEqual("<div>&lt; > &amp; <div>&lt; > &amp;</div></div>");
    });

    it("should not escape XML in text node when disabled", function() {
        var output = compileAndRender("/test-templates/escape-xml-disabled.rhtml", {});
        expect(output).toEqual("<div>< > & <div>< > &</div></div>");
    });

    it("should allow for static properties to be applied to tag handlers", function() {
        var output = compileAndRender("/test-templates/tag-with-static-props.rhtml", {title: "My Page Title"});
        expect(output).toEqual('Hello World(string)50(number)Hello Static(string)100(number)');
    });

    it("should allow for input expressions to be provided to tag handler nodes", function() {
        var output = compileAndRender("/test-templates/tag-input-expressions.rhtml", {name: "Frank", adult: true});
        expect(output).toEqual('Hello Frank! adult=true');        
    });

    it("should allow for using helper objects", function() {
        var output = compileAndRender("/test-templates/helper-objects.rhtml", {});
        expect(output).toEqual('Hello WORLD!');
    });
});