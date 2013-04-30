function main() {
    function resetProps(item) {
        for (var i in item.initData) {
            console.log("resetting: " + i);
            item[i] = item.initData[i];
        }
    }

    var ViewModel = function() {
        var self = this;
        self.poi = ko.observable();
        self.removePoi = function() {
            self.poi().getEntity().removeMapObject();
            self.poi().getEntity().remove();
            $('#myModal').foundation('reveal', 'close');
        };
        self.cancelEdit = function() {
            self.poi().getEntity().refresh();
            $('#myModal').foundation('reveal', 'close');
        };
        self.saveEdit = function () {
            var e = self.poi().getEntity();
            resetProps(e);
            e.save();
            $('#myModal').foundation('reveal', 'close');
        };
    };
    var v = new ViewModel();
    ko.applyBindings(v);

    //var lmap = L.map('map').setView([47.4981, 19.04], 13);


    lmap = new L.Map('map', { center: new L.LatLng(40.72121341440144, -74.00126159191132), maxZoom: 22, zoom: 12 });
    //var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    var bing = new L.BingLayer("AmpN66zZQqp8WpszBYibPXrGky0EiHLPT75WtuA2Tmj7bS4jgba1Wu23LJH1ymqy");
    //var cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/003d6e8d9af14e7582b462c10e572a1a/997/256/{z}/{x}/{y}.png');
    lmap.addLayer(bing);
    //lmap.addControl(new L.Control.Layers({ "Bing": bing, 'CloudMade': cloudmade, 'OSM': osm,  }, {}));

    //alert("getting position");
    navigator.geolocation.getCurrentPosition(function (o) {
        //console.dir(arguments);
        lmap.setView([o.coords.latitude, o.coords.longitude], 15);
        //alert("position acquired");
        console.log("position:", o);
    })
    var lgroup = new L.LayerGroup().addTo(lmap);

    //L.tileLayer('http://{s}.tile.cloudmade.com/003d6e8d9af14e7582b462c10e572a1a/997/256/{z}/{x}/{y}.png', {
    //    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
    //    maxZoom: 18
    //}).addTo(lmap);



    function add2map(g) {
        var onEachFeature = function(feature, layer) {
            layer.options.draggable = true;
            layer.on('dragend', function(e) {
                g.latlon.coordinates = [e.target._latlng.lng, e.target._latlng.lat];
                g.latlon = g.latlon;
                resetProps(g);
                g.save();


            });
            layer.on('click', function() {
                v.poi(g.asKoObservable());
                $('#myModal').foundation('reveal', 'open');
            });
        };
        var x = L.geoJson(g.latlon, { onEachFeature: onEachFeature }); // .bindPopup(g.name);
        lgroup.addLayer(x);
        g.removeMapObject = function () {
            lgroup.removeLayer(x);
        }
    }

    var onTheMap = {};
    
    //$data.service("http://192.168.10.101:12345/hyperlocal").then(function (tp) {
    //    var hl = tp();
    //    hl.onReady().then(function () {
    //        lmap.on("dragend", function () {
    //            hl.getGeo(lmap.getCenter()).then(function (r) {
    //                r.results.forEach(function (p) {
    //                    if (!onTheMap[p.record_id]) {
    //                        console.log("adding point", p);
    //                        L.marker([p.record.lat, p.record.lon]).addTo(lmap);
    //                        onTheMap[p.record_id] = true;
    //                    }
    //                });
    //            });
    //        });
    //    });
    //});

    $data.initService('http://dev-open.jaystack.net/a11d6738-0e23-4e04-957b-f14e149a9de8/1162e5ee-49ca-4afd-87be-4e17c491140b/api/mydatabase')
    .then(function (mydatabase, factory, type) {

        mydatabase
            .HyperLocal
            .toArray(function(result) {
                result.forEach(function(g) {
                    add2map(g);
                });
            });

        var timer;

        lmap.on('click', function(e) {
            window.clearTimeout(timer);
            timer = window.setTimeout(function() {
                var g = new mydatabase.HyperLocal.elementType();
                g.latlon = new $data.GeographyPoint(); // $data.Point(e.latlng);
                g.latlon.coordinates = [e.latlng.lng, e.latlng.lat];
                g.z = "HYP3RL0C4LZZZ";
                g.save();
                add2map(g);
            }, 200);        
        });
        lmap.on('dblclick', function(e) {
            window.clearTimeout(timer);
        });
     });
};

