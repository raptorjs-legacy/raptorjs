require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

raptor.find('raptor-legacy');


var legacyRaptor = global.raptor;

describe('legacy raptor module', function() {

    it('should support normalizing module IDs', function() {
        expect(legacyRaptor.require('json')).toEqual(raptor.require('raptor/json'));
        expect(legacyRaptor.require('json.stringify')).toEqual(raptor.require('raptor/json/stringify'));
        expect(legacyRaptor.require('json.parse')).toEqual(raptor.require('raptor/json/parse'));
        expect(legacyRaptor.require('debug')).toEqual(raptor.require('raptor/debug'));
        expect(legacyRaptor.require('listeners')).toEqual(raptor.require('raptor/listeners'));
        expect(legacyRaptor.require('logging')).toEqual(raptor.require('raptor/logging'));
        expect(legacyRaptor.require('pubsub')).toEqual(raptor.require('raptor/pubsub'));
        expect(legacyRaptor.require('objects')).toEqual(raptor.require('raptor/objects'));
        expect(legacyRaptor.require('strings')).toEqual(raptor.require('raptor/strings'));
        expect(legacyRaptor.require('templating')).toEqual(raptor.require('raptor/templating'));
        expect(legacyRaptor.require('templating.compiler')).toEqual(raptor.require('raptor/templating/compiler'));
        expect(legacyRaptor.require('widgets')).toEqual(raptor.require('raptor/widgets'));
    });

    it('should support legacy modules', function() {
        var a = {};

        legacyRaptor.define('test.my-module', function() {
            return a;
        });

        var myModule = legacyRaptor.require('test.my-module');
        expect(myModule).toEqual(a);
    });
});
