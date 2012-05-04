

xdescribe('widgets module', function() {
    
    before(function() {
        createBrowserRaptor();
    });
    
    after(function() {
        createRaptor();
    });
    
    raptor.defineClass('test.widgets.ButtonWidget', function(raptor) {
        return {
            events: ['testEvent'],
            
            initBeforeOnDomReady: true,
            
            init: function(config) {
                this.initCalled = true;
                this.label = config.label;
            },
            
            getLabel: function() {
                return this.label;
            }
        };
    });
    
    it('should allow multiple widgets to be initialized', function() {
        var widgets = raptor.require('widgets');
        expect(widgets.initAll).toNotEqual(null);
                
        widgets.initAll(
                ['test.widgets.ButtonWidget','w0', null, {"label":"Button 1"}],
                ['test.widgets.ButtonWidget','w1', null, {"label":"Button 2"}]);
        
        expect(widgets.get('w0')).toNotEqual(null);
        expect(widgets.get('w1')).toNotEqual(null);
        
        expect(widgets.get('w0').initCalled).toEqual(true);
        expect(widgets.get('w1').initCalled).toEqual(true);
        
        expect(widgets.get('w0').getLabel()).toEqual("Button 1");
        expect(widgets.get('w1').getLabel()).toEqual("Button 2");
     });
    
    it('should apply Widget properties to the prototype of all widget classes', function() {
        var widgets = raptor.require('widgets');
        widgets.initAll(
                ['test.widgets.ButtonWidget','w0',null,{"label":"Button 1"}]);
        
        expect(widgets.get('w0').getElId('test')).toEqual("w0-test");
     });
    
    it('should allow access to child widgets', function() {
        expect(true).toEqual(true);

        var widgets = raptor.require('widgets');
        widgets.initAll(
                ['test.widgets.ButtonWidget','w0',null,{"label":"Button 1"}, [
                    ['test.widgets.ButtonWidget','w1','childButton',{"label":"Child Widget"}]]]);
        
        expect(widgets.get('w0').getChild('childButton').getLabel()).toEqual("Child Widget");
     });
    
    it('should make all widgets listeners', function() {
        expect(true).toEqual(true);
        
        
        var widgets = raptor.require('widgets');
        widgets.initAll(
                ['test.widgets.ButtonWidget','w0',{"label":"Button 1"}]);
        
        var buttonWidget = widgets.get('w0');
        var thisObj = {};
        var testEventFired = false;
        
        buttonWidget.on('testEvent', function(one, two) {
            expect(thisObj).toStrictlyEqual(thisObj);
            expect(one).toEqual(1);
            expect(two).toEqual(2);
            testEventFired = true;
        }, thisObj);
        
        buttonWidget.notify('testEvent', 1, 2);
        
        expect(testEventFired).toEqual(true);
     });
});