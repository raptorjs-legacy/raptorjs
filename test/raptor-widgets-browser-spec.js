require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

var compileAndLoad = helpers.templating.compileAndLoad,
    compileAndRender = helpers.templating.compileAndRender,
    jsdomWrapper = helpers.jsdom.jsdomWrapper;

describe('widgets module in the browser', function() {
      
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
//            ready: function(window, raptor, done) {
//                window.initWidgets();
//                window.$(function() {
//                    done();
//                });
//            }
//        });
//
//    });

    it('should allow widgets to be initialized', function(done) {

        jsdomWrapper({
            html: compileAndRender('/pages/widgets/SimpleWidgetPage.rhtml'),
            require: [
               '/js/jquery-1.8.3.js',
               'raptor',
               'raptor/widgets',
               'pages/widgets/SimpleWidgetPage'
            ],
            error: done,
            success: function(window) {
                var PageWidget = window.require('pages.widgets.PageWidget');
                window.initWidgets();
                var document = window.document;
                var widgets = window.require('raptor/widgets');

                //console.error('WIDGET FUNCTIONS: ', window.require('raptor/templating/taglibs/widgets/WidgetFunctions'));

                window.$(function() {
                    try
                    {
                        expect(PageWidget.instance).toNotEqual(null);
                        expect(PageWidget.instance.widgets.getWidget('buttonAssignedId')).toNotEqual(null);
                        expect(PageWidget.instance.widgets.getWidget('buttonAssignedId2')).toNotEqual(null);
                        expect(PageWidget.instance.widgets.getWidget('button1')).toNotEqual(null);
                        expect(PageWidget.instance.widgets.getWidget('button1').getEl().id).toEqual("myButton");
                        expect(PageWidget.instance.widgets.getWidget('button1').$().prop("id")).toEqual("myButton");
                        expect(PageWidget.instance.getEl('myDiv').className).toEqual("myDiv");
                        expect(PageWidget.instance.$("#myDiv").prop("className")).toEqual("myDiv");
                        expect(PageWidget.instance.$("#myDiv .mySpan").prop("className")).toEqual("mySpan");    

                        expect(PageWidget.instance.widgets.getWidget('button1')).toNotEqual(null);

                        expect(PageWidget.instance.widgets.getWidget('rerenderButton')).toNotEqual(null);
                        expect(PageWidget.instance.getWidget('rerenderButton')).toNotEqual(null);
                        expect(document.getElementById('rerenderButton')).toNotEqual(null);

                        //console.error('SimpleWidgetPage: document.body BEFORE rerender: ', document.body.innerHTML);

                        PageWidget.instance.getWidget('rerenderButton').rerender({
                            label: 'Button 2 Rerendered',
                            id: 'rerenderButton2'
                        });

                        //console.error('SimpleWidgetPage: document.body AFTER rerender: ', document.body.innerHTML);

                        expect(PageWidget.instance.getWidget('rerenderButton')).toEqual(null);
                        expect(document.getElementById('rerenderButton')).toEqual(null);
                        expect(document.getElementById('rerenderButton2')).toNotEqual(null);

                        expect(widgets.get('rerenderButton')).toEqual(null);

                        expect(widgets.get('rerenderButton2')).toNotEqual(null);
                        expect(widgets.get('rerenderButton2').getLabel()).toEqual('Button 2 Rerendered');
                    }
                    catch(e) {
                        done(e);
                    }
                    
                    done();
                });
                
                
            }
        });

    });
});