/* jshint unused: false */
/* jshint freeze: false */

require('pebblejs');
require('./html_parse');
var ajax = require('pebblejs/lib/ajax'),
    scrape = {};

/**
 * Requests the given url, returning the html data to the callback
 */
scrape.requestSchedule = function(bandURL, bandName, callback) {
    /*for (var i = 0; i < localStorage.length + 5; i++)
        console.log("Key " + i + " is " + localStorage.getItem(localStorage.key(i)));*/

    if(bandURL == "") callback([createDisplayItem("Not Yet Available", "", true)]);
    ajax({url: bandURL}, function(responseText) {
        var jsonData;
        try {
            jsonData = htmlToJson(responseText, bandName);
            localStorage.setItem(bandName, JSON.stringify(jsonData));
        }
        catch(err) {
            //throw err;
            console.error(JSON.stringify(err, ["message", "arguments", "type", "name"]));
            if(err instanceof SyntaxError)
                jsonData = [createDisplayItem("Invalid Url", "Contact Developer", true)];
            else
                jsonData = [createDisplayItem("Error processing", "Contact Developer", true)];
        }
        callback(jsonData);
    }, function(responseText) {
        var storedData = localStorage.getItem(bandName), jsonData;
        // If there is no internet, try to pull the most recent pulled information
        if(storedData !== null) {
            jsonData = JSON.parse(storedData);
        }
        else
            jsonData = [createDisplayItem("No internet", "Try again later", true)];
            
        callback(jsonData);
    });
};

function htmlToJson(htmlData, bandName) {
    var jsonData = HTMLtoJSON(htmlData).html.body;
    switch(bandName) {
        case "Wind Symphony":
            return getWindSymphonyData(jsonData);
        case "Campus Band":
            return getCampusBandData(jsonData);
        case "Symphony Orchestra":
            return getSymphonyOrchestraData(jsonData);
        default:
            return;
    }
}

function getWindSymphonyData(jsonData) {
    var returnData = [{},{}];
    // Go to the element containing the important data
    jsonData = traverseToKey(jsonData, ["div#layout-type-1","div#wrapper","div#content","div#content-middle","div#node-6#node#node-page#clearfix",
                                        "div#content#clearfix","div#field#field-name-body#field-type-text-with-summary#field-label-hidden","div#field-items",
                                        "div#field-item#even","div#content#clearfix","div#field#field-name-body#field-type-text-with-summary#field-label-hidden",
                                        "div#field-items","div#field-item#even"]);
    // Travel to where the data for each day is stored is stored
    var monData = traverseToKey(jsonData, ["p","strong","text"]).split(",");
    // What day of the week and the date
    returnData[0] = createDisplayItem(monData[0], monData[1].split("|")[0]);

    var wedData = traverseToKey(jsonData, ["p.1","strong","text"]);
    if(wedData) {
        wedData = wedData.split(",");
        returnData[1] = createDisplayItem(wedData[0], wedData[1].split("|")[0]);
    }

    var dayIndex = 0;
    // Loop over the whole structure to look for the pieceInfo, goes over both days
    Object.keys(jsonData).forEach(function(outerKey) {
        // Only loop over elements containing what pieces are being played
        if(outerKey.split(".")[0] != "ul") return;
        Object.keys(jsonData[outerKey]).forEach(function(key) {
            if(key.split(".")[0] == "li") {
                var pieceText = jsonData[outerKey][key].text || jsonData[outerKey][key].span.text;
                // Split based on PM
                pieceText = pieceText.split(/\s?[pP].?[mM].?\s?/);
                if(pieceText.length == 1)
                    returnData[dayIndex].pieceInfo.push(createDisplayItem(pieceText[0]));
                else
                    returnData[dayIndex].pieceInfo.push(createDisplayItem(pieceText[1], pieceText[0] + " PM"));
            }
        });
        dayIndex++;
    });
    return returnData;
}

function getCampusBandData(jsonData) {
    jsonData = traverseToKey(jsonData, ["div#layout-type-1","div#wrapper","div#content","div#content-middle","div#node-47#node#node-page#clearfix","div#content#clearfix",
                                        "div#field#field-name-body#field-type-text-with-summary#field-label-hidden","div#field-items","div#field-item#even"]);
    var returnData = [{}];
    returnData[0] = createDisplayItem("Monday");

    Object.keys(jsonData).forEach(function(key) {
        if(hasIdentifier(key, "MsoNormal")) {
            if(!jsonData[key].span.text) return;
            var pieceText = jsonData[key].span.text.split(/\s?-\s?/);
            if(pieceText.length == 1)
                returnData[0].pieceInfo.push(createDisplayItem(pieceText[0]));
            else
                returnData[0].pieceInfo.push(createDisplayItem(pieceText[1], pieceText[0] + " PM"));
        }
    });
    return returnData;
}

function getSymphonyOrchestraData(jsonData) {
    jsonData = traverseToKey(jsonData, ["div#page#hfeed#site","div#content#site-content","div#primary#content-area","div#content#site-content",
                                        "article#post-149#post-149#page#type-page#status-publish#hentry","div#entry-content"]);
    var returnData = [];
    console.log(JSON.stringify(jsonData));
    Object.keys(jsonData).forEach(function(key) {
       if(key.split(".")[0] == "p" && "text" in jsonData[key])
           returnData.push(key);
    });
    console.log(returnData);
}

/**
 * Creates an item that is used in the pebble UI menu
 * @param invalid - Whether the display item is valid (if it should be allowed to be clicked on), e.g. for errors
 */
function createDisplayItem(title, subtitle, invalid) {
    return {
        title    : title,
        subtitle : subtitle || "",
        pieceInfo: [],
        invalid  : invalid || false
    };
}

/**
 * Goes to the level in the object as specified by the parameter
 * @param levels - An array of the keys to descend into
 */
function traverseToKey(obj, levels) {
    var retObj = obj;
    for(var i in levels) {
        if(levels[i] in retObj) retObj = retObj[levels[i]];
        else {
            console.error(levels[i] + " not in object in traverseToKey");
            return false;
        }
    }
    return retObj;
}

/**
 * Checks if the key has the identifier (either a class or an id)
 * @param id - The id to search for
 */
function hasIdentifier(key, id) {
    // Remove unique ID
    key = key.split(".")[0];
    var identifiers = key.split("#");

    for(var i = 1; i < identifiers.length; i++) {
        if(identifiers[i] == id) return true;
    }
    return false;
}

module.exports = scrape;