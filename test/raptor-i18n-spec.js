require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe('packaging module', function() {


    it('should find i18n dependencies for package manifest', function(done) {
        var i18n = require('raptor/i18n');
        i18n.setSupportedLocales(['sp']);

        i18n._findI18nDependencies('i18n/module1', function(err, dependencies) {
            expect(err).toEqual(null);

            var paths = dependencies.map(function(dependency) {
                return dependency.path;
            });

            expect(paths).toEqual(['module2.i18n.json', 'module1.i18n.json']);
            done();
        });
    });

    it('should allow read of raw dictionary for locale code', function(done) {
        var i18n = require('raptor/i18n');
        i18n.setSupportedLocales(['sp']);

        i18n._findI18nDependencies('i18n/module1', function(err, dependencies) {

            expect(err).toEqual(null);

            var expected = [{
                    'goodBye': 'Adios'
                }, {
                    'hello': 'Hola'
                }],
                pending = dependencies.length;

            function readRawDictionary(dependency, i) {
                i18n._readRawDictionary(dependency.getI18nResource(), 'sp', function(err, rawDictionary) {
                    pending--;

                    expect(rawDictionary).toEqual(expected[i]);
                    
                    if (pending === 0) {
                        done();
                    }
                })
            }

            for (var i = 0; i < dependencies.length; i++) {
                readRawDictionary(dependencies[i], i);
            }
        });
    });

    it('should allow batch loading of dictionaries for a given locale', function(done) {
        var i18n = require('raptor/i18n');
        i18n.setSupportedLocales(['sp']);

        i18n.loadDictionariesForModule('i18n/module1', 'sp', function(err, dictionaries) {

            expect(err).toEqual(null);

            var dictionary;

            dictionary = dictionaries.getDictionary('i18n/module1');
            expect(dictionary.get('hello')).toEqual('Hola');

            dictionary = dictionaries.getDictionary('i18n/module2');
            expect(dictionary.get('goodBye')).toEqual('Adios');

            done();
        });
    });

});