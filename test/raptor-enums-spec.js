raptor.defineEnum(
    'test.enums.simple.Day',
    [
        "SUN",
        "MON",
        "TUE",
        "WED",
        "THU",
        "FRI",
        "SAT"
    ]);

raptor.defineEnum(
    'test.enums.complex.Day',
    {
        SUN: [false, "Sunday"],
        MON: [true, "Monday"],
        TUE: [true, "Tuesday"],
        WED: [true, "Wednesday"],
        THU: [true, "Thursday"],
        FRI: [true, "Friday"],
        SAT: [false, "Saturday"]
    },
    function(raptor, type) {
        return {
            init: function(isWeekday, longName) {
                this._isWeekday = isWeekday;
                this._longName = longName;
            },
             
            getLongName: function() {
                return this._longName;
            },
             
            isWeekday: function() {
                return this._isWeekday;
            }
        };
    });
 
raptor.defineEnum(
        'test.enums.complex.Day2',
        {
            SUN: [false, "Sunday"],
            MON: [true, "Monday"],
            TUE: [true, "Tuesday"],
            WED: [true, "Wednesday"],
            THU: [true, "Thursday"],
            FRI: [true, "Friday"],
            SAT: [false, "Saturday"]
        },
        function(raptor, type) {
            var Day2 = function(isWeekday, longName) {
                this._isWeekday = isWeekday;
                this._longName = longName;
            };
            
            Day2.TEST_STATIC = true;
            
            Day2.prototype = {
                getLongName: function() {
                    return this._longName;
                },
                 
                isWeekday: function() {
                    return this._isWeekday;
                },
                
                toString: function() {
                    return this._longName;
                }
            };
            
            return Day2;
        });

describe('enums', function() {

    before(function() {
        createRaptor();
    });
    
    it('should allow simple enums', function() {
        var Day = raptor.require('test.enums.simple.Day');
        expect(Day.SUN).toNotEqual(null);
    });
    
    it('should allow instanceof to be used with enum vales', function() {
        var SimpleDay = raptor.require('test.enums.simple.Day');
        expect(SimpleDay.SUN instanceof SimpleDay).toEqual(true);
        
        
        var ComplexDay = raptor.require('test.enums.complex.Day');
        expect(ComplexDay.SUN instanceof ComplexDay).toEqual(true);
        expect(ComplexDay.SUN instanceof SimpleDay).toEqual(false);
        
        
        var ComplexDay2 = raptor.require('test.enums.complex.Day2');
        expect(ComplexDay2.SUN instanceof ComplexDay2).toEqual(true);
    });
    
    it('should allow enums to have static properties', function() {

        var ComplexDay2 = raptor.require('test.enums.complex.Day2');
        expect(ComplexDay2.TEST_STATIC).toNotEqual(null);
    });
    
    it('should support "valueOf" method for enum classes', function() {
        var SimpleDay = raptor.require('test.enums.simple.Day');
        expect(SimpleDay.valueOf("SUN")).toStrictlyEqual(SimpleDay.SUN);
    });

    it('should support "ordinal" method for enum values', function() {
        var SimpleDay = raptor.require('test.enums.simple.Day');
        expect(SimpleDay.SUN.ordinal()).toEqual(0);
        expect(SimpleDay.MON.ordinal()).toEqual(1);
        expect(SimpleDay.TUE.ordinal()).toEqual(2);
        
    });
    
    it('should support "name" method for enum values', function() {
        var SimpleDay = raptor.require('test.enums.simple.Day');
        expect(SimpleDay.SUN.name()).toEqual("SUN");
    });

    it('should support "toString" method for enum values', function() {
        var SimpleDay = raptor.require('test.enums.simple.Day');
        expect(SimpleDay.SUN.toString()).toEqual("SUN");
        
        var ComplexDay2 = raptor.require('test.enums.complex.Day2');
        expect(ComplexDay2.SUN.toString()).toEqual("Sunday");
    });

    it('should support "compareTo" method for enum values', function() {
        var SimpleDay = raptor.require('test.enums.simple.Day');
        expect(SimpleDay.SUN.compareTo(SimpleDay.MON) < 0).toEqual(true);
        expect(SimpleDay.MON.compareTo(SimpleDay.SUN) > 0).toEqual(true);
        expect(SimpleDay.MON.compareTo(SimpleDay.MON) === 0).toEqual(true);
        expect(SimpleDay.MON.compareTo(SimpleDay.THU) < 0).toEqual(true);
        expect(SimpleDay.THU.compareTo(SimpleDay.MON) > 0).toEqual(true);
    });

    

});