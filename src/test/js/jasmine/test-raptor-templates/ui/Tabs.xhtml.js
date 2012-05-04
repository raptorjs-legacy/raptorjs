raptor.require("raptor.templating").register(
    "/ui/Tabs.xhtml", 
    function(context) {
        var path = "/ui/Tabs.xhtml",
            forEach = raptor.forEach,
            raptor_widget1 = context._createHandler("raptor.widget", {line: 0, col: 0, path: path}),
            pos1 = {line: 6, col: 13};
        
        context = null; //Don't need to hold a reference to the load context anymore
        
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
            
                context._renderComponent(
                        raptor_widget1,
                        {
                            jsClass: "ui.TabsWidget",
                            renderBody: function(context, widget) {
                                write('<ul class="nav nav-tabs" id="');
                                write(widget.elId());
                                write('">');
                                forEach(data.tabs, function(tab) {
                                    write('<a href="#');
                                    write(tab.title);
                                    write(' data-toggle="tab">');
                                    write(tab.renderBody());
                                });
                                
                                write("</li>");
                                write("<li>Age: ");
                                write(sibling.age);
                                write("</li></ul>");
                            }
                        },
                        pos1);
        };
    });