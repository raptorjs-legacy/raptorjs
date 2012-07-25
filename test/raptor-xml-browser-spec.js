require('./_helper.js');

var jsdomScripts = helpers.jsdom.jsdomScripts,
    jsdomWrapper = helpers.jsdom.jsdomWrapper;

describe('XML parsing in the browser', function() {
    before(function() {
        createRaptor();
    });
      
    it('should allow DOM parsing', function() {
        
        
        jsdomWrapper({
            html: "<html><head><title>XML</title></head><body></body></html>",
            require: [
               '/js/jquery-1.7.js',
               'core',
               '/js/init-raptor.js',
               'xml.sax'
            ],
            ready: function(window, raptor, done) {
                var sax = raptor.require('xml.sax');
                var parser = sax.createParser();
                
                var result = [];
                
                parser.on({
                    error: function(e) {
                        result.push({error: e});
                    },
                    
                    characters: function(t) {
                        result.push({characters: t});
                    },
                    
                    startElement: function(el) {
                        result.push({startElement: el});    
                    },
                    
                    endElement: function (el) {
                        result.push({endElement: el});  
                    }
                }, this);
                
                parser.parse('<c:template xmlns:c="core">A<nested attr="test">B</nested>C</c:template>');
                expect(result[0].startElement.getLocalName()).toEqual("template");
                expect(result[0].startElement.getPrefix()).toEqual("c");
                expect(result[0].startElement.getQName()).toEqual("c:template");
                expect(result[0].startElement.getNamespaceURI()).toEqual("core");
                expect(result[0].startElement.getNamespaceMappings()["c"]).toEqual("core");
                expect(result[1].characters).toEqual("A");
                expect(result[2].startElement.getLocalName()).toEqual("nested");
                expect(result[2].startElement.getPrefix()).toEqual("");
                expect(result[2].startElement.getQName()).toEqual("nested");
                expect(result[2].startElement.getNamespaceURI()).toEqual("");
                expect(result[2].startElement.getAttributes().length).toEqual(1);
                expect(result[2].startElement.getAttributes()[0].getLocalName()).toEqual("attr");
                expect(result[3].characters).toEqual("B");
                expect(result[4].endElement.getLocalName()).toEqual("nested");
                expect(result[4].endElement.getPrefix()).toEqual("");
                expect(result[4].endElement.getQName()).toEqual("nested");
                expect(result[4].endElement.getNamespaceURI()).toEqual("");
                expect(result[4].endElement.getAttributes().length).toEqual(1);
                expect(result[4].endElement.getAttributes()[0].getLocalName()).toEqual("attr");
                expect(result[5].characters).toEqual("C");
                expect(result[6].endElement.getLocalName()).toEqual("template");
                expect(result[6].endElement.getPrefix()).toEqual("c");
                expect(result[6].endElement.getQName()).toEqual("c:template");
                expect(result[6].endElement.getNamespaceURI()).toEqual("core");
                expect(result[6].endElement.getNamespaceMappings()["c"]).toEqual("core");
                done();
            }
        });

    });
});