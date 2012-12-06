define(
    "taglibs.test.TestFunctions",
    function(require) {
        var testInfo = {};
        
        return {
            trim: function(str, info) {
                testInfo.trimThisObj = this;
                return str ? str.trim() : str;
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