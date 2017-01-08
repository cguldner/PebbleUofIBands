var UI = require('ui');
var scrape = require('./scraping');

var ensembleList = new UI.Menu({
    sections: [
        {
            title: 'Bands',
            items: [
                {title: 'Wind Symphony'},
                {title: 'Campus Band'},
                {title: 'Wind Orchestra'},
                {title: 'Hindsley'},
                {title: 'University Band'}
            ]
        },
        {
            title: 'Orchestras'
        }
    ]
});

ensembleList.on('select', function(e) {
    // Define the card used to show the schedule
    var daysInfo = new UI.Menu({
        sections: [{
            title: e.item.title,
            items: [{}]
        }]
    }),
        loadingItem = {
            title: 'Loading...',
        },
        url = "";
    
    // Switch the url based on the name of the band
    switch(e.item.title) {
        case "Wind Symphony":
            url = "http://bands.illinois.edu/content/wind-symphony-rehearsal-schedule";
            break;
        case "Campus Band":
            url = "http://bands.illinois.edu/content/campus-band-rehearsal-schedule";
            break;
        default:
            break;
    }
    // Request the information from the website, and retrieve the useful data
    scrape.requestSchedule(url, e.item.title, function(jsonData) {
        console.log('Got response: ' + JSON.stringify(jsonData));
        daysInfo.items(0, jsonData);
    });

    // Show the loading text while waiting for the information to load
    daysInfo.items(0, [loadingItem]);
    daysInfo.show();
    
    daysInfo.on('select', function(e) {
        var pieceInfo = new UI.Menu({
            sections: [{
                title: e.item.title + " - " + e.item.subtitle,
                items: e.item.pieceInfo
            }]
        });
        pieceInfo.show();
    });
    //console.log('SELECTED ITEM #' + e.itemIndex + ' of section #' + e.sectionIndex);
    //console.log('The item is titled "' + e.item.title + '"');
});

ensembleList.show();