require('./_helper.js');

var compileAndLoad = helpers.templating.compileAndLoad,
    compileAndRender = helpers.templating.compileAndRender,
    jsdomScripts = helpers.jsdom.jsdomScripts,
    jsdomWrapper = helpers.jsdom.jsdomWrapper;

describe('widgets module in the browser', function() {
    before(function() {
        createRaptor();
    });
      
//    it('should allow widgets to be initialized', function() {
//        
//        jsdomWrapper({
//            html: compileAndRender('/pages/widgets/WidgetsTestPage.rhtml'),
//            scripts: [
//               '/js/jquery-1.7.js',
//               'core',
//               '/js/init-raptor.js',
//               'widgets'
//            ],
//            loaded: function(window, raptor, done) {
//                window.initWidgets();
//                done();
//            }
//        });
//
//    });

    it('should allow widgets to be initialized', function() {
        
        jsdomWrapper({
            html: compileAndRender('/pages/widgets/SingleWidgetPage.rhtml'),
            require: [
               '/js/jquery-1.7.js',
               'core',
               '/js/init-raptor.js',
               'widgets',
               'components/widgets/Button',
               'components/widgets/Button-renderer'
            ],
            ready: function(window, raptor, done) {
                window.initWidgets();
                var widgets = raptor.require('widgets');
                expect(widgets.get('s0')).toNotEqual(null);
                done();
            }
        });

    });

    xit('should allow DOM widget elements to be looked up', function() {
        
        var done = false,
            exception = null;
        
        runs(function() {
            var jsdom = require('jsdom');

            try {
                jsdom.env({
                    html: getTestHtmlUrl('two-buttons.html'),
                    scripts: getRequiredBrowserScripts([
                        { lib: 'jquery' },
                        { module: 'core' }, 
                        { file: getTestJavaScriptPath('init-raptor.js') },
                        { module: 'widgets' },
                        { file: getTestJavaScriptPath('widgets/input/ButtonWidget.js') },
                        { file: getTestHtmlPath('two-buttons.js') }
                    ]),
                    done: function(errors, window) {
                        expect(!errors || errors.length == 0).toEqual(true);
                        
                        var raptor = window.raptor;
                        var widgets = raptor.require('widgets');
                        var widget = widgets.get('w0');
                        expect(widget.getEl('button')).toNotEqual(null);
                        expect(widget.initInvoked).toEqual(true);
                        expect(widget.init).toNotEqual(null);
                        expect(widget.getLabel()).toEqual("Button 1");
                        
                        done = true;
                    }
                });
            }
            catch(e) {
                done = true;
                exception = e;
                console.error('Error: ' + e);
            }

        });
        
        expect(exception).toEqual(null);
        
        waitsFor(function() {
            return done === true;
          }, "done callback never invoked by jsdom", 10000);
        
        
    });

    xit('should allow DOM widget elements to be looked up', function() {
        
        var done = false,
            exception = null;
        
        runs(function() {
            var jsdom = require('jsdom');

            try {
                jsdom.env({
                    html: getTestHtmlUrl('two-buttons.html'),
                    scripts: getRequiredBrowserScripts([
                        { lib: 'jquery' },
                        { module: 'core' }, 
                        { resource: getTestJavaScriptPath('init-raptor.js') },
                        { module: 'widgets' },
                        { file: getTestJavaScriptPath('widgets/input/ButtonWidget.js') },
                        { file: getTestHtmlPath('two-buttons.js') }
                    ]),
                    done: function(errors, window) {
                        expect(!errors || errors.length == 0).toEqual(true);
                        
                        var raptor = window.raptor;
                        var widgets = raptor.require('widgets');
                        var widget = widgets.get('w0');
                        expect(widget.getEl('button')).toNotEqual(null);
                        expect(widget.initInvoked).toEqual(true);
                        expect(widget.init).toNotEqual(null);
                        expect(widget.getLabel()).toEqual("Button 1");
                        
                        done = true;
                    }
                });
            }
            catch(e) {
                done = true;
                exception = e;
                console.error('Error: ' + e);
            }

        });
        
        expect(exception).toEqual(null);
        
        waitsFor(function() {
            return done === true;
          }, "done callback never invoked by jsdom", 10000);
        
        
    });
    
    xit('should allow children to be looked up', function() {
        
        var done = false;
        
        runs(function() {
            var jsdom = require('jsdom');
    
            jsdom.env({
                html: getTestHtmlUrl('parent-child.html'),
                scripts: getRequiredBrowserScripts([
                    { lib: 'jquery' },
                    { module: 'core' }, 
                    { file: getTestJavaScriptPath('init-raptor.js') },
                    { module: 'widgets' },
                    { file: getTestJavaScriptPath('widgets/input/ButtonWidget.js') },
                    { file: getTestJavaScriptPath('widgets/nesting/ParentWidget.js') },
                    { file: getTestHtmlPath('parent-child.js') }
                ]),
                done: function(errors, window) {
                    expect(!errors || errors.length == 0).toEqual(true);
                    
                    var raptor = window.raptor;
                    var widgets = raptor.require('widgets');
                    
                    var button1 = widgets.get('w0');
                    expect(button1).toNotEqual(null);
                    expect(button1._childId).toEqual('button1');
                    expect(button1.config).toNotEqual(null);
                    expect(button1.getLabel()).toEqual('Button 1');
                    
                    var button2 = widgets.get('w1');
                    expect(button2).toNotEqual(null);
                    expect(button2._childId).toEqual('button2');
                    expect(button2.getLabel()).toEqual('Button 2');
                    
                    var parent = widgets.get('w2');
                    expect(parent).toNotEqual(null);
                    
                    button1 = parent.getChild('button1');
                    button2 = parent.getChild('button2');
                    
                    expect(button1.getLabel()).toEqual('Button 1');
                    expect(button2.getLabel()).toEqual('Button 2');
                    
                    var childButtons = parent.getChildren('buttons');
                    expect(childButtons).toNotEqual(null);
                    expect(childButtons.length).toEqual(2);
                    
                    expect(childButtons[0].getLabel()).toEqual('Repeated Button 1');
                    expect(childButtons[1].getLabel()).toEqual('Repeated Button 2');
                    
                    var childWidgets = parent.getChildren();
                    expect(childWidgets.length).toEqual(4);
                    done = true;
                }
            });
        });
        
        waitsFor(function() {
            return done === true;
          }, "done callback never invoked by jsdom", 10000);
        
    });
    
    xit('should allow jQuery to be used to look up widget elements', function() {
        
        var done = false;
        
        runs(function() {
            var jsdom = require('jsdom');
    
            jsdom.env({
                html: getTestHtmlUrl('jquery-test.html'),
                scripts: getRequiredBrowserScripts([
                    { lib: 'jquery' },
                    { module: 'core' }, 
                    { file: getTestJavaScriptPath('init-raptor.js') },
                    { module: 'widgets' },
                    { file: getTestJavaScriptPath('widgets/jquery/JqueryTestWidget.js') },
                    { file: getTestHtmlPath('jquery-test.js') }
                ]),
                done: function(errors, window) {
                    expect(!errors || errors.length == 0).toEqual(true);
                    
                    var raptor = window.raptor;
                    var widgets = raptor.require('widgets');
                    
                    var widget = widgets.get('w0');
                    expect(widget.$).toNotEqual(null);
                    
                    var el = widget.getEl('rootDiv');
                    var jqueryEl = widget.$('#rootDiv');
                    
                    expect(el.id).toEqual(jqueryEl.prop('id'));
                    
                    
                    var nestedSpan = widget.$('#rootDiv .testSpan');
                    expect(nestedSpan.size()).toEqual(1);
                    expect(nestedSpan.prop('id')).toEqual('nestedSpan');
                    
                    done = true;
                }
            });
        });
        
        waitsFor(function() {
            return done === true;
          }, "done callback never invoked by jsdom", 10000);
        
    });
});