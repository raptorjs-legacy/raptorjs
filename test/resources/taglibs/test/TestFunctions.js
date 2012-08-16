raptor.define(
    "taglibs.test.TestFunctions",
    function(raptor) {
        var testInfo = {};
        
        return {
            trim: function(str, info) {
                testInfo.trimThisObj = this;
                return str ? raptor.require("strings").trim(str) : str;
            },
            upperCase: function(str, info) {
                testInfo.upperCaseThisObj = this;
                return str ? str.toUpperCase(str) : str;
            },
            
            user: function(str) {
                testInfo.userThisObj = this;
                return this.attributes["loggedInUser"];
            },
            
            isLoggedIn: function() {
                testInfo.isLoggedInThisObj = this;
                return this.attributes["loggedInUser"] != null; 
            },
            
            getTestInfo: function() {
                return testInfo;
            }
        };
    });