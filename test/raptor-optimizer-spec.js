require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);
var path = require('path');



describe('optimizer module', function() {
    "use strict";
    
    var logger = require('raptor/logging').logger('raptor-optimizer-spec'),
        forEachEntry = raptor.forEachEntry,
        forEach = raptor.forEach,
        compileAndRender = helpers.templating.compileAndRender,
        compileAndRenderAsync = helpers.templating.compileAndRenderAsync,
        MockWriter = helpers.templating.MockWriter,
        testOptimizer = function(configPath, optimizerOptions, options) {
        
            var optimizer = require('raptor/optimizer');
            var config = optimizer.loadConfigXml(configPath);
            var pageOptimizer = optimizer.createPageOptimizer(config);
            var context = optimizerOptions.context || {};
            optimizerOptions.context = context;
            optimizerOptions.writer = new MockWriter(pageOptimizer);
            var done = options.done;
            if (!done) {
                throw new Error('"done" argument is required');
            }

            try
            {
                pageOptimizer.optimizePage(optimizerOptions)
                    .then(
                        function(optimizedPage) {

                            if (options.success) {
                                try {
                                    options.success(optimizedPage, optimizerOptions.writer);
                                }
                                catch(e) {
                                    done(e);
                                }
                            }
                            done();
                        },
                        done);
            }
            catch(e) {
                done(e);
            }
        };

    // it('should handle de-duplication correctly', function(done) {
    //     testOptimizer(
    //         path.join(__dirname, 'resources/optimizer/de-dupe-optimizer-config.xml'),
    //         {
    //             pageName: "testPage",
    //             dependencies: [{ "module": "test/optimizer/moduleA" },
    //                            { "module": "test/optimizer/moduleB" },
    //                            { "module": "test/optimizer/moduleC" }]
    //         },
    //         {
    //             success: function(optimizedPage, writer) {
    //                 expect([
    //                         path.join(__dirname, 'resources/optimizer/build/bundle1.js'),
    //                         path.join(__dirname, 'resources/optimizer/build/bundle2.js')
    //                     ])
    //                     .toEqual(writer.getOutputBundlePaths());

    //                 expect(writer.getCodeForFilename('bundle1.js')).toEqual('moduleA\nmoduleB');
    //                 expect(writer.getCodeForFilename('bundle2.js')).toEqual('moduleC');
    //             },
    //             done: done    
    //         });
    // });

    // it('should handle unbundled dependencies', function(done) {
    //     testOptimizer(
    //         path.join(__dirname, 'resources/optimizer/unbundled-dependency-optimizer-config.xml'),
    //         {
    //             pageName: "testPage",
    //             dependencies: [{ "module": "test/optimizer/moduleA" },
    //                            { "module": "test/optimizer/moduleB" },
    //                            { "module": "test/optimizer/moduleC" }]
    //         },
    //         {
    //             success: function(optimizedPage, writer) {
    //                 expect([
    //                         path.join(__dirname, 'resources/optimizer/build/bundle1.js'),
    //                         path.join(__dirname, 'resources/optimizer/build/bundle2.js'),
    //                         path.join(__dirname, 'resources/optimizer/build/testPage.js')
    //                     ])
    //                     .toEqual(writer.getOutputBundlePaths());

    //                 expect(writer.getCodeForFilename('bundle1.js')).toEqual('moduleA');
    //                 expect(writer.getCodeForFilename('bundle2.js')).toEqual('moduleB');
    //                 expect(writer.getCodeForFilename('testPage.js')).toEqual('moduleC');
    //             },
    //             done: done    
    //         });
    // });

    // it('should allow for slots', function(done) {
    //     testOptimizer(
    //         path.join(__dirname, 'resources/optimizer/slots-optimizer-config.xml'),
    //         {
    //             pageName: "testPage",
    //             dependencies: [{ "module": "test/optimizer/mixedA" },
    //                            { "module": "test/optimizer/slotA" }],
    //             includeSlotNameForBundles: true
    //         },
    //         {
    //             success: function(optimizedPage, writer) {
    //                 expect(optimizedPage.getSlotHtml('head')).toEqual('<link rel="stylesheet" type="text/css" href="/testPage-head.css">\n<script type="text/javascript" src="/testPage-head.js"></script>');
    //                 expect(optimizedPage.getSlotHtml('body')).toEqual('<link rel="stylesheet" type="text/css" href="/testPage-body.css">\n<script type="text/javascript" src="/testPage-body.js"></script>');

    //                 expect(writer.getCodeForFilename('testPage-head.css')).toEqual('mixedA_css');
    //                 expect(writer.getCodeForFilename('testPage-head.js')).toEqual('slotA_js');
    //                 expect(writer.getCodeForFilename('testPage-body.css')).toEqual('slotA_css');
    //                 expect(writer.getCodeForFilename('testPage-body.js')).toEqual('mixedA_js');
    //             },
    //             done: done    
    //         });
    // });

    // it('should allow for slot overriding', function(done) {
    //     testOptimizer(
    //         path.join(__dirname, 'resources/optimizer/slot-overrides-optimizer-config.xml'),
    //         {
    //             pageName: "testPage",
    //             dependencies: [{ "module": "test/optimizer/mixedA", "js-slot": "custom-body", "css-slot": "custom-head"},
    //                            { "module": "test/optimizer/slotB" }],
    //             includeSlotNameForBundles: true
    //         },
    //         {
    //             success: function(optimizedPage, writer) {
    //                 expect(optimizedPage.getSlotHtml('custom-head')).toEqual('<link rel="stylesheet" type="text/css" href="/testPage-custom-head.css">');
    //                 expect(optimizedPage.getSlotHtml('custom-body')).toEqual('<script type="text/javascript" src="/testPage-custom-body.js"></script>');
    //                 expect(optimizedPage.getSlotHtml('head2')).toEqual('<script type="text/javascript" src="/testPage-head2.js"></script>');
    //                 expect(optimizedPage.getSlotHtml('body2')).toEqual('<link rel="stylesheet" type="text/css" href="/testPage-body2.css">');

    //                 expect(writer.getCodeForFilename('testPage-custom-head.css')).toEqual('mixedA_css\nslotB_css');
    //                 expect(writer.getCodeForFilename('testPage-custom-body.js')).toEqual('mixedA_js\nslotB_js');
    //                 expect(writer.getCodeForFilename('testPage-head2.js')).toEqual('nestedB_js\nnestedA_js');
    //                 expect(writer.getCodeForFilename('testPage-body2.css')).toEqual('nestedB_css\nnestedA_css');
    //             },
    //             done: done    
    //         });
    // });

    // it('should allow for loader metadata', function(done) {
    //     testOptimizer(
    //         path.join(__dirname, 'resources/optimizer/async-optimizer-config.xml'),
    //         {
    //             pageName: "testPage",
    //             dependencies: [{ "module": "test/optimizer/mixedA"},
    //                            { "module": "test/optimizer/asyncA" },
    //                            { "type": "loader-metadata" }],
    //             includeSlotNameForBundles: true
    //         },
    //         {
    //             success: function(optimizedPage, writer) {
    //                 expect(optimizedPage.getSlotHtml('head')).toEqual('<link rel="stylesheet" type="text/css" href="/testPage-head.css">');
    //                 expect(optimizedPage.getSlotHtml('body')).toEqual('<script type="text/javascript" src="/testPage-body.js"></script>');

    //                 expect(writer.getCodeForFilename('testPage-async-body.js')).toEqual('nestedB_js\nnestedA_js');
    //                 expect(writer.getCodeForFilename('testPage-async-head.css')).toEqual('nestedB_css\nnestedA_css');
    //                 expect(writer.getCodeForFilename('testPage-body.js')).toEqual("mixedA_js\nmoduleA\nasyncA_js\n$rset('loaderMeta',{\"test/optimizer/nestedB\":{\"css\":[\"/testPage-async-head.css\"],\"js\":[\"/testPage-async-body.js\"]},\"test/optimizer/nestedA\":{\"requires\":[\"test/optimizer/nestedB\"],\"css\":[\"/testPage-async-head.css\"],\"js\":[\"/testPage-async-body.js\"]}});");
    //                 expect(writer.getCodeForFilename('testPage-head.css')).toEqual('mixedA_css\nasyncA_css');
    //             },
    //             done: done    
    //         });
    // });

    // it('should allow for output filters', function(done) {
    //     testOptimizer(
    //         path.join(__dirname, 'resources/optimizer/filters-optimizer-config.xml'),
    //         {
    //             pageName: "testPage",
    //             dependencies: [{ "module": "test/optimizer/filtersA"}]
    //         },
    //         {
    //             success: function(optimizedPage, writer) {
    //                 expect(writer.getCodeForFilename('testPage.js')).toEqual('filtersA_js-JavaScriptFilter1Async-JavaScriptFilter2Async');
    //                 expect(writer.getCodeForFilename('testPage.css')).toEqual('filtersA_css-CSSFilter1-CSSFilter2');
    //             },
    //             done: done    
    //         });
    // });

    // it("should allow for optimizer tags in templates", function(done) {
    //     var templating = require('raptor/templating');
    //     var renderContext = templating.createContext();
    //     var configPath = require('raptor/files').joinPaths(__dirname, '/resources/optimizer/project-a/optimizer-config.xml');
    //     require('raptor/optimizer').configure(configPath);
        
    //     var writeFileCount = 0;

    //     var pageOptimizer = require('raptor/optimizer').getDefaultPageOptimizer();
    //     var writer = new MockWriter(pageOptimizer);
    //     writer.subscribe('fileWritten', function(eventArgs) {
    //         writeFileCount++;
    //     });

    //     pageOptimizer.getConfig().setWriter(writer);

    //     var pending = 0;

    //     var runCount = 3;
    //     var runResults = new Array(runCount);
    //     var expectedOutput = '<html><head><link rel="stylesheet" type="text/css" href="/static/optimizer.css"></head><body><script type="text/javascript" src="/static/optimizer.js"></script></body></html>';
    //     function runComplete() {
    //         if (--pending === 0) {
    //             for (var i=0; i<runCount; i++) {
    //                 expect(runResults[i]).toEqual(expectedOutput);
    //             }
                
    //             expect(writer.getCodeForFilename('optimizer.js')).toEqual('mixedA_js\nmixedB_js');
    //             expect(writer.getCodeForFilename('optimizer.css')).toEqual('mixedA_css\nmixedB_css');
    //             expect(writeFileCount).toEqual(2);
    //             done();
    //         }
    //     }

    //     function runTest(num) {
    //         pending++;
    //         compileAndRenderAsync("/test-templates/optimizer.rhtml", {}, renderContext)
    //             .then(
    //                 function(context) {
    //                     var output = context.getOutput();
    //                     runResults[num] = output;
    //                     runComplete();
    //                 },
    //                 function(e) {
    //                     logger.error(e);
    //                     done(e);
    //                 });
    //     }

    //     for (var i=0; i<runCount; i++) {
    //         runTest(i);
    //     }
    // });

    // it('should allow for in-place deployment', function(done) {
    //     testOptimizer(
    //         path.join(__dirname, 'resources/optimizer/in-place-optimizer-config.xml'),
    //         {
    //             pageName: "testPage",
    //             dependencies: [{ "module": "test/optimizer/mixedA" },
    //                            { "module": "test/optimizer/mixedB" }],
    //             includeSlotNameForBundles: true,
    //             basePath: __dirname
    //         },
    //         {
    //             success: function(optimizedPage, writer) {
    //                 expect(optimizedPage.getSlotHtml('head')).toEqual('<link rel="stylesheet" type="text/css" href="resources/test/optimizer/mixedA/mixedA.css">\n<link rel="stylesheet" type="text/css" href="resources/test/optimizer/mixedB/mixedB.css">');
    //                 expect(optimizedPage.getSlotHtml('body')).toEqual('<script type="text/javascript" src="resources/test/optimizer/mixedA/mixedA.js"></script>\n<script type="text/javascript" src="resources/test/optimizer/mixedB/mixedB.js"></script>');
    //             },
    //             done: done    
    //         });
    // });

    // it('should allow for URLs with the file:// protocol when in-place deployment is enabled', function(done) {
    //     testOptimizer(
    //         path.join(__dirname, 'resources/optimizer/in-place-optimizer-config.xml'),
    //         {
    //             name: "page1",
    //             packageFile: require('raptor/files').joinPaths(__dirname, 'resources/optimizer/file-urls/page1-package.json')
    //         },
    //         {
    //             success: function(optimizedPage, writer) {

    //                 var jsFiles = optimizedPage.getJavaScriptFiles();
    //                 var cssFiles = optimizedPage.getCSSFiles();

    //                 expect(jsFiles.length).toEqual(3);
    //                 expect(cssFiles.length).toEqual(2);

    //                 expect(jsFiles)
    //                     .toEqual([
    //                         path.join(__dirname, 'resources/test/optimizer/mixedA/mixedA.js'),
    //                         path.join(__dirname, 'resources/test/optimizer/mixedB/mixedB.js'),
    //                         path.join(__dirname, 'resources/optimizer/build/test-optimizer-rhtml-test-template.rhtml-body.js')
    //                     ]);

    //                 expect(cssFiles)
    //                     .toEqual([
    //                         path.join(__dirname, 'resources/test/optimizer/mixedA/mixedA.css'),
    //                         path.join(__dirname, 'resources/test/optimizer/mixedB/mixedB.css')
    //                     ]);
    //             },
    //             done: done    
    //         });
    // });

    // it('should allow for image URLs in CSS files to be resolved', function(done) {
    //     testOptimizer(
    //         path.join(__dirname, 'resources/optimizer/css-url-filter-optimizer-config.xml'),
    //         {
    //             name: "testPage",
    //             dependencies: [{ "module": "test/optimizer/css-url-filter" }]
    //         },
    //         {
    //             success: function(optimizedPage, writer) {
    //                 var expected = '.test-1 {background-image: url(ebay-logo_d481eb85.png);}\n.test-2 {background-image: url(ebay-logo_d481eb85.png);}\n.test-3 {background-image: url(ebay-logo_d481eb85.png);}\n.test-4 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE8AAAAeCAYAAABt5kPUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpGNzdGMTE3NDA3MjA2ODExODhDNkIzODA1MTg5Nzc0NiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpGRTg2MEMyMzZFNzIxMUUyQjZGMEE2ODM0MDRENkNFNiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpGRTg2MEMyMjZFNzIxMUUyQjZGMEE2ODM0MDRENkNFNiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjAyODAxMTc0MDcyMDY4MTE5OTRDOTI2RkUxMEEyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkY3N0YxMTc0MDcyMDY4MTE4OEM2QjM4MDUxODk3NzQ2Ii8+IDwvcmRmOkRlc2NyaXB0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);}';
    //                 var actual = writer.getCodeForFilename('testPage-b573d3b9.css');
    //                 expect(expected).toEqual(actual);
    //             },
    //             done: done    
    //         });
    // });

    // it("should allow for optimizer tags in templates with dynamic dependencies", function(done) {
    //     var templating = require('raptor/templating');
    //     var renderContext = templating.createContext();
    //     var configPath = require('raptor/files').joinPaths(__dirname, '/resources/optimizer/project-a/optimizer-config.xml');
    //     require('raptor/optimizer').configure(configPath);
        
    //     var writeFileCount = 0;

    //     var pageOptimizer = require('raptor/optimizer').getDefaultPageOptimizer();
    //     var writer = new MockWriter(pageOptimizer);
    //     writer.subscribe('fileWritten', function(eventArgs) {
    //         writeFileCount++;
    //     });

    //     pageOptimizer.getConfig().setWriter(writer);

    //     compileAndRenderAsync("/test-templates/optimizer-dynamic.rhtml", {
    //         dependency: "test/optimizer/mixedA",
    //         mixedBEnabled: false
    //     }, renderContext)
    //         .then(
    //             function(context) {
    //                 var output = context.getOutput();
    //                 var expectedOutput = '<html><head><link rel="stylesheet" type="text/css" href="/static/optimizer-dynamic.css"></head><body><script type="text/javascript" src="/static/optimizer-dynamic.js"></script></body></html>';
    //                 expect(output).toEqual(expectedOutput);
    //                 expect(writer.getCodeForFilename('optimizer-dynamic.js')).toEqual('mixedA_js');
    //                 expect(writer.getCodeForFilename('optimizer-dynamic.css')).toEqual('mixedA_css');
    //                 expect(writeFileCount).toEqual(2);
    //                 done();
    //             },
    //             function(e) {
    //                 logger.error(e);
    //                 done(e);
    //             });
    // });

    it('should allow for names to be given to an anonymous define', function(done) {
        testOptimizer(
            path.join(__dirname, 'resources/optimizer/define-optimizer-config.xml'),
            {
                name: "page1",
                packageFile: require('raptor/files').joinPaths(__dirname, 'resources/optimizer/define/page1-package.json')
            },
            {
                success: function(optimizedPage, writer) {

                    var jsFiles = writer.getOutputBundleFilenames();

                    expect(jsFiles.length).toEqual(1);

                    expect(writer.getCodeForFilename(jsFiles[0])).toEqual('(function(){var define=$rdef("foo");foo}());\n(function(){var define=undefined;bar}());');
                },
                done: done    
            });
    });

});