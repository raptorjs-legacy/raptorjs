describe('raptor loader module', function() {

    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    
    before(function() {
        createRaptor();
    });
    
    it('should allow JavaScript resources to be loaded dynamically', function() {
        
        var done = false,
            exception = null,
            _window = null;
        
        runs(function() {
            var jsdom = require('jsdom');
    
            jsdom.env({
                html: getTestHtmlUrl('loader-test.html'),
                scripts: getRequiredBrowserScripts([
                    { lib: 'jquery' },
                    { module: 'core' }, 
                    { file: getTestJavaScriptPath('init-raptor.js') },
                    { module: 'widgets' },
                    { module: 'loader' },
                    { file: getTestJavaScriptPath('loader/loader-test.js') }
                ]),
                done: function(errors, window) {
                    expect(!errors || errors.length == 0).toEqual(true);
                    _window = window;
                    window.XMLHttpRequest = XMLHttpRequest;
                    
                    var raptor = window.raptor;
                    var loader = raptor.require('loader');
                    expect(loader).toNotEqual(null);
                    
                    try{
                        window.executeTest(
                                expect,
                                function() {
                                    done = true;
                                },
                                {
                                    console: console,
                                    baseUrl: "file://" + getTestJavaScriptPath() + "/loader"
                                });
                    }
                    catch(e) {
                        done = true;
                        
                        exception = e;
                    }
                }
            });
        });
        
        waitsFor(function() {
            
            if (done) {
                
                if (exception) {
                    expect(exception.message).toEqual(null);
                    console.error(exception.message + ". Stacktrace: " + exception.stack);
                }
            }
            
            return done === true;
          }, "completeCallback never called for loader test", 10000);

        
    });
});