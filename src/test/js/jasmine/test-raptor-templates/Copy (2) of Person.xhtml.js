raptor.require("raptor.templating").register(
    "/Person.xhtml", 
    function(context) {
        var path = "/Person.xhtml",
            forEach = raptor.forEach,
            ui_tabs1 = context._createHandler("ui.tabs", {line: 22, col: 0, path: path}),
            ui_tab1 = context._createHandler("ui.tab", {line: 23, col: 10, path: path}),
            ui_tab2 = context._createHandler("ui.tab", {line: 26, col: 10, path: path}),
            pos1 = {line: 6, col: 13};
        
        context = null; //Don't need to hold a reference to the context anymore
        
        return function(person, context) {
            var write = function(str) {
                    context.write(str);
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
                        pos.path = path;
                        context.handleException(e, pos);
                    }
                };
                
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
        
            context._renderComponent(
                    ui_tabs1,
                    {
                        horizontal: true,
                        renderBody: function(context) {
                            context._renderComponent(
                                    ui_tab1,
                                    {
                                        title: "Mother",
                                        renderBody: function(context) {
                                            write(person.mother);
                                        }
                                    }, 
                                    pos1);
                                    
                            forEach(person.siblings, function(sibling) {
                                if (sibling == null) {
                                    sibling = "";
                                }
                                
                                context._renderComponent(
                                    ui_tab2,
                                    {
                                        title: "Sibling: " + sibling.name,
                                        renderBody: function(context) {
                                            write("<ul><li>Name: ");
                                            write(sibling.name);
                                            write("</li>");
                                            write("<li>Age: ");
                                            write(sibling.age);
                                            write("</li></ul>");
                                        }
                                    },
                                    pos1);
                            });
                        }
                    }, 
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
            
            write("</div>");
            
        };
    });