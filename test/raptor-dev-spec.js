require('./_helper.js');



describe('development spec', function() {
    var logger = raptor.require('logging').logger('raptor-dev-spec'),
        compileAndLoad = helpers.templating.compileAndLoad,
        compileAndRender = helpers.templating.compileAndRender;
        
    before(function() {
        createRaptor();
    });
    
    xit("should allow for optimizer tags in templates", function() {
        var template = raptor.require('templating');
        var renderContext = template.createContext();
        var optimizerConfigPath = raptor.require('files').joinPaths(__dirname, '/resources/optimizer/project-a/optimizer-config.xml');
        var optimizer = raptor.require('optimizer').createOptimizer(optimizerConfigPath);
        optimizer.setOptimizerForContext(renderContext);
        
        var output = compileAndRender("/test-templates/optimizer.rhtml", {}, renderContext);
        expect(output).toEqual('Hello Frank! You have 20 new messages.Hello Frank! You have 20 new messages.Hello Frank! You have 20 new messages.');
    });
    
    it("should allow for nodes to be converted to expressions", function() {
        var ElementNode = raptor.require('templating.compiler.ElementNode');
        var TextNode = raptor.require('templating.compiler.TextNode');
        var TemplateBuilder = raptor.require('templating.compiler.TemplateBuilder');

        var compiler = raptor.require('templating.compiler').createCompiler();
        var template = new TemplateBuilder(compiler);
        
        var div = new ElementNode("div");
        var text = new TextNode("Hello World!");
        div.appendChild(text);
        
        var expression = div.getExpression(template).toString();
        
        var sb = raptor.require('strings').createStringBuilder();
        var context = raptor.require('templating').createContext(sb);
        var output = eval(expression);
        expect(output.toString()).toEqual('<div>Hello World!</div>');
        
    });
    
    xit("should allow for includes", function() {
        var output = compileAndRender("/test-templates/include.rhtml", {});
        expect(output).toEqual('Hello Frank! You have 20 new messages.Hello Frank! You have 20 new messages.Hello Frank! You have 20 new messages.');
    });
    
    xit("should allow for simple template handlers", function() {
        var output = compileAndRender("/test-templates/simple-handlers.rhtml", {dynamic: "universe"});
        expect(output).toEqual('<ul><li>Hello world! adult=false</li><li>Hello universe! adult=true</li><li>Hello Dynamic: universe! adult=false</li></ul>');
    });
    
    xit("should allow for widgets", function() {
        compileAndLoad("/test-templates/widgets_nested.rhtml");
        
        var output = compileAndRender("/test-templates/widgets.rhtml", {});
        expect(output).toEqual('<div id="one"><div>TRUE</div></div>,<div id="two"><div>TRUE</div></div>');
    });
    
    xit("should allow for dynamic attributes", function() {
        var output = compileAndRender("/test-templates/dynamic-attributes.rhtml", {});
        expect(output).toEqual('test: Hello|dynamic attributes: [class=my-class, id=myId]');
    });
    
    xit("should allow for template handlers with nested body content", function() {
        var output = compileAndRender("/test-templates/nested-handlers.rhtml", {showConditionalTab: false});
        expect(output).toEqual('<div class="tabs"><ul class="nav nav-tabs"><li class="active"><a href="#tab0" data-toggle="tab">Tab 1</a></li><li class=""><a href="#tab1" data-toggle="tab">Tab 2</a></li></ul><div class="tab-content"><div id="tab0" class="tab-pane active">Tab 1 content</div><div id="tab1" class="tab-pane">Tab 2 content</div></div></div>');
    });
    
    xit("should allow for simple conditionals", function() {
        var output = compileAndRender("/test-templates/simple-conditionals.rhtml", {name: "John", count: 51});
        expect(output).toEqual('Hello JOHN! You have 10 new messages.');        
    });

});