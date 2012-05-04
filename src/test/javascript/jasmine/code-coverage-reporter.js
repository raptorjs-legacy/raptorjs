var coverageReportDir = process.env.JSCOVERAGE_REPORT_DIR;
var nodePath = require('path');
var fs = require('fs');
var jsonFile = nodePath.join(coverageReportDir, "/coverage.json");

var convertCoverageData = function(coverageData) {
    var files = [];
    
    raptor.forEachEntry(coverageData, function(filename, hitCountsArray) {
        var file = {
            filename: filename,
            hitCounts: []
        };
        
        files.push(file);
        
        var totalLineCount = 0,
            hitLineCount = 0;
        raptor.forEach(hitCountsArray, function(hitCount, i) {
            if (hitCount === undefined) {
                return;
            }
            file.hitCounts.push({
                line: i,
                hitCount: hitCount
            });
            totalLineCount++;
            if (hitCount > 0) {
                hitLineCount++;
            }
        });
        
        file.totalLineCount = totalLineCount;
        file.hitLineCount = hitLineCount;
        file.hitLinePercentage = hitLineCount / totalLineCount * 100;
    });
    
    return {
        files: files
    };
};

exports.save = function(coverageData) {

    coverageData = convertCoverageData(coverageData);
    
    var coverageDataJson = JSON.stringify(coverageData);

    console.log(coverageData);
    
    try
    {
        //Create the parent directory
        fs.mkdirSync(coverageReportDir, '0777');
    }
    catch(e) {
        //Assume the directory already existed...
    }
    
    fs.writeFile(jsonFile, coverageDataJson, "utf8", function (err) {
        if (err) throw err;
        console.log('JSON coverage data successfully written to file: ' + jsonFile);
      });
    
};
