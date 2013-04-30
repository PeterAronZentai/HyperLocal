importScripts('geohash.js');

var metadata = {};
postMessage({
    type: "metadata_download_start"
});

function loadmeta(d) {
    metadata = d;
    postMessage({ type: 'metadata' });
}

var pointsOnMap = {

}

function combine(items) {
    var r = items.map(function(v) { return v ? v.toLowerCase() : ''; });
    return r.join('_');
}
var db = [];
postMessage({
    type: "db_download_start", length: db.length
});
function loaddb(d) {
    db = [];
    postMessage({
        type: "db_download_success", length: db.length
    });
    d.forEach(function (item) {
        if (item) {
            var latlng = decodeGeoHash(item.d[0]);
            db.push({
                record_id: item._id,
                geoHash: item.d[0],
                name: item.d[1],
                text: combine([item.d[1], metadata['cat'][item.d[2]], metadata['subcat'][item.d[3]], metadata['type'][item.d[4]] ]),
                record: {
                    id: item._id,
                    name: item.d[1],
                    lat: latlng.latitude[0],
                    lon: latlng.longitude[0],
                    cat: metadata['cat'][item.d[2]],
                    subcat: metadata['subcat'][item.d[3]],
                    type: metadata['type'][item.d[4]]
                }
            });
        }
    });
    postMessage({
        type: "db_ready", length: db.length
        //,db:db
    });
}

importScripts('db/m.json');
importScripts('db/p.json');

var window = self;
window.document = {};



onerror = function (e) {
    postMessage({
        type: 'error',
        error: e
    })
}
onmessage = function (msg) {
    switch (msg.data.type) {
        case "search":

            break;
    }
}
function doSearch(options) {
    postMessage({
        type: 'search',
        url: url,
        result: []
    });
}

//self.onmessage = function (msg) {
//    switch (msg.type) {
//        case "search":
//            //script
//            break;
//    }
//    //postMessage("w1:msg:rec", arguments);
//}

//var svcUrl = "http://127.0.0.1:6789/svc";

//self.setInterval(function () {
//    //postMessage("w1:heart", arguments);
//}, 5000);