raptor.require("raptor.templating").register(
    "Person", 
    function(context) {
        var path = "/Person.xhtml",
            forEach = raptor.forEach,
            Prog = context._getHandlerClass("template.asyncFragment"),
            ui_Tabs = context._getHandlerClass("ui.tabs"),
            ui_Tab = context._getHandlerClass("ui.tab"),
            ui_Button = context._getHandlerClass("ui.button"),
            pos1 = {line: 6, col: 13};
        
        context = null; //Don't need to hold a reference to the load context anymore
        
        return function(context, person, widget) {
            var write = function(str) {
                    context.write(str);
                },
                handleException = function(e, pos) {
                    pos.path = path;
                    context.handleException(e, pos);
                },
                /*
                 * NOTE: Only "unsafe" expressions need to be wrapped such as. Unsafe operations
                 * - Function calls. Example: person.isAdult()
                 * - Expressions with more than one dot: person.address.city
                 * - First part of expression is not a local variable
                 * 
                 * Safe regular expression:
                 * /^!?([$_a-zA-Z0-9]*)(?:\.[$_a-zA-Z0-9]*)?(?:\s*(?:===|==|!=|!==)\s*(?:([$_a-zA-Z0-9]*)(?:.[$_a-zA-Z0-9]*)|true|false|[0-9]*(?:\.[0-9]*)?|"(?:[^"]|\\")*"|'(?:[^']|\\')*'))?$/
                 * 
                 * NOTE: If it is safe, we must make sure that the first part of the "safe" variable exists as a local variable!
                 * 
                 * NOTE: The compiler should check to make sure all of the JavaScript expressions compile by doing the following:
                 * eval("function() { " + expression +";}")
                 */
                safe = function(func, pos) {
                    try {
                        return func();
                    }
                    catch(e) {
                        handleException(e, pos);
                    }
                };
              
            context.newPage({path: path}, function(page) {
                write("Hello ");
                
                write(person.name);
            
                write('<div><ul class="friends">');
                forEach(person.friends, function(friend) {
                    if (friend == null) {
                        friend = "";
                    }
                    
                    write("<li>");
                    write(friend);
                    write("</li>");
                });
                
                write("</ul>");
                if (safe(function() { return person.hasChildren(); }, pos1)) {
                    write('<div class="has-children">Conditional (enclosing div)</div>');
                }
                
                if (safe(function() { return person.hasChildren(); }, pos1)) {
                    write("Conditional (NO enclosing div)");
                }
            
                context._invokeHandler(
                        ui_Tabs,
                        {
                            horizontal: true                        
                        }, 
                        function(tabs /*introduces new nested variable*/) {
                            
                            context._invokeHandler(
                                    ui_Tab,
                                    extend(person.tabData, {
                                        title: "Mother",
                                        tabs: tabs /* pass along nested variables that were requested to be imported */
                                    }), 
                                    function() {
                                        write(person.mother);
                                    },
                                    page,
                                    pos1);
                            
                            context._invokeHandler(
                                    ui_Tab,
                                    {
                                        title: "Mother",
                                        tabs: tabs /* pass along nested variables that were requested to be imported */
                                    }, 
                                    function() {
                                        write(person.mother);
                                    },
                                    page,
                                    pos1);
                                    
                            forEach(person.siblings, function(sibling) {
                                if (sibling == null) {
                                    sibling = "";
                                }
                                
                                context._invokeHandler(
                                    ui_Tab,
                                    {
                                        title: "Sibling: " + sibling.name,
                                        tabs: tabs /* pass along requested nested variables */
                                    },
                                    function() {
                                        write("<ul><li>Name: ");
                                        write(sibling.name);
                                        write("</li>");
                                        write("<li>Age: ");
                                        write(sibling.age);
                                        write("</li></ul>");
                                        
                                        context._invokeHandler(
                                                ui_Button,
                                                {
                                                    widgetId: "testButton",
                                                    widgetPage: page,
                                                    label: "Test Button"
                                                },
                                                null,
                                                page,
                                                pos1);
                                    },
                                    pos1);
                            });
                        },
                        page,
                        pos1);
                
                write("Age group:");
                
                if (safe(function() { return person.isTeenager(); }, pos1)) {
                    write("Teenager");
                }
                else if (safe(function() { return person.isAdult(); }, pos1)) {
                    write("Adult");
                }
                else if (safe(function() { return person.isSenior(); }, pos1)) {
                    write("Senior");
                }
                else {
                    write("Unknown");
                }
                
                context._invokeHandler(
                    template_AsyncFragment,
                    {
                        delay: 0
                    },
                    function() {
                        write("This chunk is rendered asynchronously with a delay");
                    },
                    page,
                    pos1);
                
                context._invokeHandler(
                        template_AsyncFragment,
                        {
                            delay: 0, 
                            autoFlush: true
                        },
                        function() {
                            write('<div class="async-div">Body content for async div</div>');
                        },
                        page,
                        pos1);
                
                /*
                 * var fragment = context.asyncFragment();
                 * fragment.finish("fragment content");
                 */
                
                write("</div>");
            }); //End context.newPage()

            
        };
    });