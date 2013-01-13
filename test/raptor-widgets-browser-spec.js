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

    it('should allow widgets to be initialized', function() {

        jsdomWrapper({
            html: compileAndRender('/pages/widgets/SimpleWidgetPage.rhtml'),
            require: [
               '/js/jquery-1.8.3.js',
               'raptor',
               'raptor/widgets',
               'pages/widgets/SimpleWidgetPage'
            ],
            ready: function(window, done) {
                var PageWidget = window.require('pages.widgets.PageWidget');
                window.initWidgets();
                window.$(function() {
                    try
                    {
                        expect(PageWidget.instance).toNotEqual(null);
                        expect(PageWidget.instance.getDoc().getWidget('button1')).toNotEqual(null);
                        expect(PageWidget.instance.getDoc().getWidget('button1').getEl().id).toEqual("myButton");
                        expect(PageWidget.instance.getDoc().getWidget('button1').getRootEl().id).toEqual("myButton");
                        expect(PageWidget.instance.getDoc().getWidget('button1').$().prop("id")).toEqual("myButton");
                        expect(PageWidget.instance.getEl('myDiv').className).toEqual("myDiv");
                        expect(PageWidget.instance.$("#myDiv").prop("className")).toEqual("myDiv");
                        expect(PageWidget.instance.$("#myDiv .mySpan").prop("className")).toEqual("mySpan");    
                    }
                    catch(e) {
                        console.error('Error: ' + e, e.stack);
                    }
                    
                    done();
                });
                
                
            }
        });

    });
});