raptor.require('widgets').initAll(
    ['widgets.nesting.ParentWidget','w2',null,null, [
        ['widgets.input.ButtonWidget','w0','button1',{"label":"Button 1"}],
        ['widgets.input.ButtonWidget','w1','button2',{"label":"Button 2"}],
        ['widgets.input.ButtonWidget','w3','buttons',{"label":"Repeated Button 1"}],
        ['widgets.input.ButtonWidget','w4','buttons',{"label":"Repeated Button 2"}]
        ]]
    );