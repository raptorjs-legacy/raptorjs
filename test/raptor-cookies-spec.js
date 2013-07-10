require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

function MockContext() {
    this.attributes = {};
    this.request = {
        headers: {}
    };
}

MockContext.prototype = {
    getAttributes: function() {
        return this.attributes;
    }
};

var now = 1357027200000; //new Date(2013, 0, 1, 0, 0, 0, 0).getTime();

require('raptor/cookies/CookieManager').prototype._now = function() {
    return now;
};




describe('config module', function() {

    it('should allow properties as part of the constructor', function() {
        
        var context = new MockContext();
        var cookies = require('raptor/cookies');

        var cookieManager = cookies.getCookieManager(context);
        var cookie = cookieManager.createCookie('hello', 'world');
        cookie.setMaxAgeDays(10);

        var cookie = cookieManager.createCookie('ping', 'pong');
        cookie.setMaxAgeDays(15);
        cookie.setSecure(true);

        var cookieBrowserCommitCode = cookieManager.getBrowserCommitCode();

        
        expect(cookieBrowserCommitCode).toEqual('document.cookie="hello=world;path=/;expires=Fri, 11 Jan 2013 08:00:00 GMT";document.cookie="ping=pong;path=/;expires=Wed, 16 Jan 2013 08:00:00 GMT;secure";');
     });
});