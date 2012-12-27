require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe('config module', function() {

    it('should allow properties as part of the constructor', function() {
        
        var config = require('raptor/config').create({
            "testProperty": {
                value: 100
            }
        });
        
        expect(config.get("testProperty")).toEqual(100);
     });
    
     it('should allow onChange callbacks for initial value', function() {
        var initialOnChangeCalled = false;
        require('raptor/config').create({
            "testProperty": {
                value: 100,
                onChange: function(value) {
                    initialOnChangeCalled = true;
                    expect(value).toEqual(100);
                }
            }            
        });
        
        expect(initialOnChangeCalled).toEqual(true);
     });
     
     it('should allow onChange callbacks after initial value', function() {
         
         var config = require('raptor/config').create({
             "testProperty": {
                 value: 100
             }            
         });
         
         var thisObj = {};
         
         var onChangeCalled = false;
         
         config.onChange('testProperty', function(newValue) {
             expect(newValue).toEqual(200);
             expect(this).toStrictlyEqual(thisObj);
             onChangeCalled = true;
         }, thisObj);
         
         config.set('testProperty', 200);
         
         expect(onChangeCalled).toEqual(true);
      });
     
     it('should allow new properties to be added', function() {
         
         var initialPropertyValue = 100;
         var newPropertyValue = 200;
         
         var config = require('raptor/config').create({
             "initialProperty": {
                 value: initialPropertyValue
             }            
         });
         
         expect(config.get('initialProperty')).toEqual(100);
         
         config.add({
             "newProperty": {
                 value: 200
             }
         });

         
         expect(config.get('initialProperty')).toEqual(100);
         expect(config.get('newProperty')).toEqual(200);
         
         config.onChange('initialProperty', function(newValue) {
             initialPropertyValue = newValue;
         }, this);
         
         config.onChange('newProperty', function(newValue) {
             newPropertyValue = newValue;
         }, this);
         
         
         
         config.set('initialProperty', 150);
         config.set('newProperty', 250);
         
         expect(initialPropertyValue).toEqual(150);
         expect(newPropertyValue).toEqual(250);
      });
});