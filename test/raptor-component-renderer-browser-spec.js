require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

var jsdomWrapper = helpers.jsdom.jsdomWrapper,
    compileAndRender = helpers.templating.compileAndRender;

describe('raptor/component-renderer module in the browser', function() {


    it('should allow widgets to be initialized', function() {

        jsdomWrapper({
            html: compileAndRender('/pages/component-renderer/ComponentRendererTest1Page.rhtml'),
            require: [
               '/js/jquery-1.8.3.js',
               'raptor',
               'raptor/widgets',
               'raptor/component-renderer',
               'taglibs/widgets',
               'pages/component-renderer/ComponentRendererTest1Page',
            ],
            ready: function(window, done) {
                var require = window.require,
                    document = window.document,
                    componentRenderer = require('raptor/component-renderer');

                window.initWidgets();
                window.$(function() {
                    try
                    {
                        var targetEl = document.getElementById('renderTarget');

                        expect(targetEl).toNotEqual(null);
                        window.require('raptor/widgets');

                        var renderToDOM = function(method) {
                            componentRenderer.render(
                                'components/component-renderer/Component1/Component1Renderer',
                                {
                                    id: method
                                })[method](targetEl);
                        };

                        var Component1Widget = window.require('components/component-renderer/Component1/Component1Widget');

                        expect(document.body.childNodes.length).toEqual(2);    
                        renderToDOM("appendChild");
                        expect(targetEl.childNodes.length).toEqual(1);
                        expect(document.getElementById('appendChild').parentNode).toEqual(targetEl);

                        renderToDOM("prependChild");
                        expect(targetEl.childNodes.length).toEqual(2);
                        expect(document.getElementById('prependChild').parentNode).toEqual(targetEl);
                        expect(document.getElementById('prependChild').nextSibling).toEqual(document.getElementById('appendChild'));

                        renderToDOM("insertBefore");
                        expect(targetEl.childNodes.length).toEqual(2);
                        expect(document.getElementById('insertBefore').nextSibling).toEqual(targetEl);
                        expect(document.body.childNodes.length).toEqual(3);

                        renderToDOM("insertAfter");
                        expect(targetEl.childNodes.length).toEqual(2);
                        expect(document.getElementById('insertAfter').previousSibling).toEqual(targetEl);
                        expect(document.body.childNodes.length).toEqual(4);

                        console.log("renderer innerHTML (before replace): " + document.body.innerHTML);

                        renderToDOM("replace");
                        expect(document.getElementById('renderTarget')).toEqual(null);
                        expect(document.body.childNodes.length).toEqual(4);
                        expect(document.getElementById('replace').previousSibling).toEqual(document.getElementById('insertBefore'));
                        expect(document.getElementById('replace').nextSibling).toEqual(document.getElementById('insertAfter'));
                        
                        expect(Component1Widget.initOrder.length).toEqual(5);
                        expect(Component1Widget.initOrder).toEqualArray([ 'appendChild','prependChild','insertBefore','insertAfter','replace' ]);
                        done();
                        
                    }
                    catch(e) {
                        done(e);
                    }
                    
                    
                });
                
                
            }
        });

    });

    it('should automatically resolve renderer names based on conventions', function() {

        jsdomWrapper({
            html: compileAndRender('/pages/component-renderer/ComponentRendererTest1Page.rhtml'),
            require: [
               '/js/jquery-1.8.3.js',
               'raptor',
               'raptor/widgets',
               'raptor/component-renderer',
               'taglibs/widgets',
               'pages/component-renderer/ComponentRendererTest1Page',
            ],
            ready: function(window, done) {
                var require = window.require,
                    document = window.document;

                window.initWidgets();
                window.$(function() {
                    try
                    {
                        var targetEl = document.getElementById('renderTarget');

                        expect(targetEl).toNotEqual(null);
                        

                        var Component1Widget = window.require('components/component-renderer/Component1/Component1Widget');
                        
                        require('raptor/component-renderer').render('components/component-renderer/Component1', { id: 'appendChild'}).appendChild(targetEl);
                        expect(targetEl.childNodes.length).toEqual(1);
                        expect(document.getElementById('appendChild').parentNode).toEqual(targetEl);
                        expect(Component1Widget.initOrder).toEqualArray([ 'appendChild' ]);
                        done();
                        
                    }
                    catch(e) {
                        done(e);
                    }
                    
                    
                });
                
                
            }
        });

    });
});