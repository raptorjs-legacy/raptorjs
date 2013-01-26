require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe('raptor loader module', function() {
    
    var _resources = {},
        resourcesBatchNum = 0;
    var setLoaderResources = function(resources) {
        resourcesBatchNum++;
        for (var k in resources) {
            if (resources.hasOwnProperty(k)) {
                _resources[resourcesBatchNum + '-' + k] = resources[k];
            }
        }
    };
    
    
    var downloadedUrls = {},
        includedUrls = {};
    
    var clearLoaderHistory = function() {
        downloadedUrls = {};
        includedUrls = {};
    };
    
    var resourceName = function(url) {
        return resourcesBatchNum + '-' + url;
    };
    
    var getLoaderResourceConfig = function(url) {
        var config = _resources[url];
        if (!config) {
            throw new Error('Resource "' + url + '" not defined for mock loader');
        }
        return config;
    };
    
    var mockLoader = raptor.extend({}, require('raptor/loader'));
    
    var mockIncludeImpl = function(url, callback) {
        var _this = this;
        
        if (downloadedUrls[url] === true) {
            throw new Error("Invalid state. Resource already included: " + url);
        }
        
        includedUrls[url] = true;
        
        var config = getLoaderResourceConfig(url);
           
        
        setTimeout(function() {
            if (config.fail) {
                callback.error();
            }
            else {
                downloadedUrls[url] = true;
                callback.success();
            }
        }, config.timeout);
    };
    
    mockLoader.handle_js = function(include, transaction) {
        var url = include.src || include.url || include;
        transaction._add(url, include, this.includeJSImpl, this);
    },
    
    mockLoader.handle_css = function(include, transaction) {
        var url = include.href || include.url || include;
        transaction._add(url, include, this.includeCSSImpl, this);
    };
    
    mockLoader.includeJS = function(src, callback, thisObj) {
        return this.include({js: [src]}, callback, thisObj);
    };
    
    mockLoader.includeCSS = function(href, callback, thisObj) {
        return this.include({css: [href]}, callback, thisObj);
    };
    
    mockLoader.includeJSImpl = function(src, callback) {
        mockIncludeImpl(src, callback);
    };
    
    mockLoader.includeCSSImpl = function(href, callback, attributes) {
        mockIncludeImpl(href, callback);
    };
    
    var EventTracker = function() {
        this.eventLookup = {};
        this.events = [];
    };
    
    EventTracker.prototype = {
        addEvent: function(event, thisObj) {
            this.eventLookup[event] = {
                thisObj: thisObj
            };
            
            this.events.push(event);
        },
        
        getEvents: function() {
            return this.events;
        },
        
        getThisObjs: function() {
            var thisObjs = [];
            raptor.forEach(this.getEvents(), function(event) {
                thisObjs.push(this.eventLookup[event].thisObj);
            }, this);
            
            return thisObjs;
        },
        
        hasEvent: function(event) {
            return this.eventLookup[event] !== undefined;
        },
        
        getThisObjForEvent: function(event) {
            return this.events[event] ? this.events[event].thisObj : null;
        },

        createCallback: function() {
            var _this = this;
            return {
                asyncStart: function() {
                    _this.addEvent('asyncStart', this);
                },
                asyncComplete: function() {
                    _this.addEvent('asyncComplete', this);
                },
                success: function() {
                    _this.addEvent('success', this);
                },
                error: function() {
                    _this.addEvent('error', this);
                },
                complete: function() {
                    _this.addEvent('complete', this);
                }
            };
        }

    };
    
    beforeEach(function() {
        clearLoaderHistory();
    });
    
    it('should use the provided "thisObj" with all callbacks for error case', function() {
        var eventTracker1 = new EventTracker();
        var eventTracker2 = new EventTracker();
        var eventTracker3 = new EventTracker();
        
        var thisObj = {id: 1},
            thisObj2 = {id: 2},
            thisObj3 = {id: 3};
        
        runs(function() {
            setLoaderResources({
                    "error1": {
                        fail: true,
                        timeout: 100
                    },
                    "error2": {
                        fail: true,
                        timeout: 100
                    }
                });
            
            mockLoader.includeJS(resourceName('error1'), eventTracker1.createCallback(), thisObj);
            mockLoader.includeJS(resourceName('error1'), eventTracker2.createCallback(), thisObj2);
            
            setTimeout(function() {
                mockLoader.includeJS(resourceName('error1'), eventTracker3.createCallback(), thisObj3);
            }, 200);
        });
        
        waitsFor(function() {
            var done = 
                eventTracker1.hasEvent('complete') && 
                eventTracker2.hasEvent('complete') &&
                eventTracker3.hasEvent('complete');
            
            if (done) {
                expect(eventTracker1.getEvents()).toEqualArray(["asyncStart", "error", "asyncComplete", "complete"]);
                expect(eventTracker1.getThisObjs()).toEqualArray([thisObj, thisObj, thisObj, thisObj]);
                
                expect(eventTracker2.getEvents()).toEqualArray(["asyncStart", "error", "asyncComplete", "complete"]);
                expect(eventTracker2.getThisObjs()).toEqualArray([thisObj2, thisObj2, thisObj2, thisObj2]);
                
                expect(eventTracker3.getEvents()).toEqualArray(["asyncStart", "error", "asyncComplete", "complete"]);
                expect(eventTracker3.getThisObjs()).toEqualArray([thisObj3, thisObj3, thisObj3, thisObj3]);
            }
            
            return done;
          }, "loader callback never invoked", 10000);

    });
    
    it('should use the provided "thisObj" with all callbacks for success case', function() {
        var eventTracker1 = new EventTracker();
        var eventTracker2 = new EventTracker();
        var eventTracker3 = new EventTracker();
        var eventTracker4 = new EventTracker();
        
        var thisObj = {id: 1},
            thisObj2 = {id: 2},
            thisObj3 = {id: 3},
            thisObj4 = {id: 4};
        
        runs(function() {
            setLoaderResources({
                    "success1": {
                        fail: false,
                        timeout: 100
                    },
                    "success2": {
                        fail: false,
                        timeout: 50
                    }
                });
            
            mockLoader.includeJS(resourceName('success1'), eventTracker1.createCallback(), thisObj);
            mockLoader.includeJS(resourceName('success1'), eventTracker2.createCallback(), thisObj2);
            
            setTimeout(function() {
                expect(
                        eventTracker1.hasEvent('complete') && 
                        eventTracker2.hasEvent('complete') && 
                        eventTracker4.hasEvent('complete'));
                
                mockLoader.includeJS(resourceName('success1'), eventTracker3.createCallback(), thisObj3);
            }, 200);
            
            mockLoader.includeJS(resourceName('success2'), eventTracker4.createCallback(), thisObj4);
        });
        
        waitsFor(function() {
            var done = 
                eventTracker1.hasEvent('complete') && 
                eventTracker2.hasEvent('complete') &&
                eventTracker3.hasEvent('complete') &&
                eventTracker4.hasEvent('complete');
            
            if (done) {
                expect(eventTracker1.getEvents()).toEqualArray(["asyncStart", "success", "asyncComplete", "complete"]);
                expect(eventTracker1.getThisObjs()).toEqualArray([thisObj, thisObj, thisObj, thisObj]);
                
                expect(eventTracker2.getEvents()).toEqualArray(["asyncStart", "success", "asyncComplete", "complete"]);
                expect(eventTracker2.getThisObjs()).toEqualArray([thisObj2, thisObj2, thisObj2, thisObj2]);
                
                expect(eventTracker3.getEvents()).toEqualArray(["success", "complete"]);
                expect(eventTracker3.getThisObjs()).toEqualArray([thisObj3, thisObj3]);
                
                expect(eventTracker4.getEvents()).toEqualArray(["asyncStart", "success", "asyncComplete", "complete"]);
                expect(eventTracker4.getThisObjs()).toEqualArray([thisObj4, thisObj4, thisObj4, thisObj4]);
            }
            
            return done;
          }, "loader callback never invoked", 10000);

    });
    
    it('should trigger error callback for invalid resources', function() {
        var eventTracker = new EventTracker();
        
        runs(function() {
            setLoaderResources({
                    "error1": {
                        fail: true,
                        timeout: 100
                    }
                });
            
            mockLoader.includeJS(resourceName('error1'), eventTracker.createCallback());
        });
        
        waitsFor(function() {
            var done = eventTracker.hasEvent('complete');
            
            if (done) {
                expect(eventTracker.getEvents()).toEqualArray(["asyncStart", "error", "asyncComplete", "complete"]);
            }
            
            return done;
          }, "loader callback never invoked", 10000);
        
        
    });
    
    it('should trigger success callback for valid resource', function() {
        var eventTracker = new EventTracker();
        
        runs(function() {
            setLoaderResources({
                "success1": {
                    fail: false,
                    timeout: 100
                }
            });
            mockLoader.includeJS(resourceName('success1'), eventTracker.createCallback());
        });
        
        waitsFor(function() {
            var done = eventTracker.hasEvent('complete');
            
            if (done) {
                expect(eventTracker.getEvents()).toEqualArray(["asyncStart", "success", "asyncComplete", "complete"]);
            }
            
            return done;
          }, "loader callback never invoked", 10000);
        
        
    });
    
    it('should not fire asyncStart and asyncComplete for resources that already downloaded', function() {
        var eventTracker1 = new EventTracker();
        var eventTracker2 = new EventTracker();
        var eventTracker3 = new EventTracker();
        var eventTracker4 = new EventTracker();

        runs(function() {
            setLoaderResources({
                    "success1": {
                        fail: false,
                        timeout: 100
                    },
                    "success2": {
                        fail: false,
                        timeout: 50
                    }
                });
            
            mockLoader.includeJS(resourceName('success1'), eventTracker1.createCallback());
            mockLoader.includeJS(resourceName('success1'), eventTracker2.createCallback());
            
            setTimeout(function() {
                expect(
                        eventTracker1.hasEvent('complete') && 
                        eventTracker2.hasEvent('complete') && 
                        eventTracker4.hasEvent('complete'));
                
                mockLoader.includeJS(resourceName('success1'), eventTracker3.createCallback());
            }, 200);
            
            mockLoader.includeJS(resourceName('success2'), eventTracker4.createCallback());
        });
        
        waitsFor(function() {
            var done = 
                eventTracker1.hasEvent('complete') && 
                eventTracker2.hasEvent('complete') &&
                eventTracker3.hasEvent('complete') &&
                eventTracker4.hasEvent('complete');
            
            if (done) {
                expect(eventTracker1.getEvents()).toEqualArray(["asyncStart", "success", "asyncComplete", "complete"]);
                expect(eventTracker2.getEvents()).toEqualArray(["asyncStart", "success", "asyncComplete", "complete"]);
                expect(eventTracker3.getEvents()).toEqualArray(["success", "complete"]);
                expect(eventTracker4.getEvents()).toEqualArray(["asyncStart", "success", "asyncComplete", "complete"]);
            }
            
            return done;
          }, "loader callback never invoked", 10000);

    });
    
    it('should support transactions', function() {
        var eventTracker1 = new EventTracker();
        var eventTracker2 = new EventTracker();
        var eventTracker3 = new EventTracker();
        var eventTracker4 = new EventTracker();

        var thisObj = {id: 1},
            thisObj2 = {id: 2},
            thisObj3 = {id: 3},
            thisObj4 = {id: 4};
        
        runs(function() {
            setLoaderResources({
                    "success1": {
                        fail: false,
                        timeout: 100
                    },
                    "success2": {
                        fail: false,
                        timeout: 50
                    },
                    "success3": {
                        fail: false,
                        timeout: 50
                    },
                    "success4": {
                        fail: false,
                        timeout: 50
                    }
                });
            
            mockLoader.include({
                js: [resourceName('success1'), 
                     resourceName('success2')],
                css: [resourceName('success3')]
            }, eventTracker1.createCallback());
            
            mockLoader.include({
                js: [resourceName('success1'), 
                     resourceName('success2')]
            }, eventTracker2.createCallback());
            
            
            
            setTimeout(function() {
                expect(
                        eventTracker1.hasEvent('complete') && 
                        eventTracker2.hasEvent('complete'));
                
                mockLoader.include({
                    js: [resourceName('success1'), 
                         resourceName('success2')]
                }, eventTracker3.createCallback());
                
                mockLoader.include({
                    js: [resourceName('success1'), 
                         resourceName('success2'),
                         resourceName('success4')] //Add a new resource that has not been downloaded
                }, eventTracker4.createCallback());
                
            }, 200);

        });
        
        waitsFor(function() {
            var done = 
                eventTracker1.hasEvent('complete') && 
                eventTracker2.hasEvent('complete') &&
                eventTracker3.hasEvent('complete') &&
                eventTracker4.hasEvent('complete');
            
            if (done) {
                expect(eventTracker1.getEvents()).toEqualArray(["asyncStart", "success", "asyncComplete", "complete"]);
                expect(eventTracker2.getEvents()).toEqualArray(["asyncStart", "success", "asyncComplete", "complete"]);
                expect(eventTracker3.getEvents()).toEqualArray(["success", "complete"]);
                expect(eventTracker4.getEvents()).toEqualArray(["asyncStart", "success", "asyncComplete", "complete"]);
            }
            
            return done;
          }, "loader callback never invoked", 10000);

    });
    
});