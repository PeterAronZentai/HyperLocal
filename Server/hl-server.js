var connect = require('connect');
require('odata-server');
var app = connect();

var mySvc = $data.EntityContext.extend("NyNs.MySvc", {
    Editors: { type: $data.EntitySet, elementType: $data.define("NyNs.Editor", {
        permitted: Boolean,
        uname: String,
        uid: String,
        id: {type: 'id', key: true, computed: true }
    }) },
    _ensureAthorized: function(user,permission, onPermitted) {
        var self = this;
        var Editors = self.Editors;
        var results = [];
        return function (inner_ok, inner_error) {
            Editors
                .filter("it.uid === id", user)
                .toArray()
                .then(function (items) {
                    if (items.length === 0) {
                        console.log("new account");
                        var newUserAccount = Editors.add({ uname: user.name, uid: user.id });
                        return Editors.saveChanges().then(function () {
                            results.push({ message: "User account created. Waiting approval", error: false });
                            console.log("account created");
                            return [newUserAccount];
                        });
                    } else {
                        console.log("account is there");
                        return items;
                    }
                })
                .then(function (items) {
                    if (items[0].permitted) {
                        results.push({ message: "Operation completed", error: false });
                        console.log("user permitted");
                        onPermitted(inner_ok, inner_error);
                    } else {
                        results.push({ message: "Permission denied", error: true });
                        inner_error(JSON.stringify(results));
                    }
                })
                .fail(inner_error);
        }
    },
    update: function (r) {
        ///<param name="r" type="Object" />
        ///<returns type="Object" />
        var p = r.record;
        var user = r.user;
        console.log("update:", r);
        return this._ensureAthorized(user, "create", function (ok, error) {
            var data = '';
            var http = require('http');
            var resFn = function (res) {
                res.on('data', function (d) {
                    data += d.toString('ascii');
                    console.log('response', d);
                });
                res.on('end', function () {
                    ok(data);
                    console.log('end');
                });
            };

            var errorFn = function (err) {
                error(err);
                console.log('error', err);
            };

            var req = http.request({
                host: 'hyperlocal.redth.info',
                port: 80,
                path: '/update?id=' + p.id,
                method: 'PUT',
            }, resFn);

            console.log('PUT', p);
            req.on('error', errorFn);
            req.end(JSON.stringify(p));

        });
    
    },
    create: function (r) {
        ///<param name="r" type="Object" />
        ///<returns type="Object" />
        var p = r.record;
        var user = r.user;
        console.log("update:", r);
        return this._ensureAthorized(user, "update", function (ok, error) {
            var data = '';
            var http = require('http');
            var resFn = function (res) {
                res.on('data', function (d) {
                    data += d.toString('ascii');
                    console.log('response', d);
                });
                res.on('end', function () {
                    ok(data);
                    console.log('end');
                });
            };

            var errorFn = function (err) {
                error(err);
                console.log('error', err);
            };

            var req = http.request({
                host: 'hyperlocal.redth.info',
                port: 80,
                path: '/docs',
                method: 'PUT',
            }, resFn);

            console.log('PUT', p);
            req.on('error', errorFn);
            req.end(JSON.stringify(p));

        });

    },
    delete: function (r) {
        ///<param name="r" type="Object" />
        ///<returns type="Object" />
        var p = r.record;
        var user = r.user;
        console.log("update:", r);
        return this._ensureAthorized(user,  "delete", function (ok, error) {
            var data = '';
            var http = require('http');
            var resFn = function (res) {
                res.on('data', function (d) {
                    data += d.toString('ascii');
                    console.log('response', d);
                });
                res.on('end', function () {
                    ok(data);
                    console.log('end');
                });
            };

            var errorFn = function (err) {
                error(err);
                console.log('error', err);
            };

            var req = http.request({
                host: 'hyperlocal.redth.info',
                port: 80,
                path: '/docs?id=' + p.id,
                method: 'DELETE',
            }, resFn);

            console.log('PUT', p);
            req.on('error', errorFn);
            req.end();

        });

    },
    reverse: function (p) {
        ///<param name="p" type="Object" />
        ///<returns type="Object" />
        // http://dev.virtualearth.net/services/v1/geocodeservice/geocodeservice.asmx/ReverseGeocode?latitude=47.47189414358602&longitude=19.007935523986816&key=Anqm0F_JjIZvT0P3abS6KONpaBaKuTnITRrnYuiJCE0WOhH6ZbE4DzeT6brvKVR5&culture=%22en-us%22&format=json
        console.log("reverse");
        console.log("params:", p);

        var result = '';


        return function (ok, fail) {
            var http = require('http');
            var resFn = function (res) {
                res.on('data', function (d) {
                    result += d.toString('utf-8');
                    //console.log('response', d);
                });
                res.on('end', function () {
                    var res = eval("(" + result + ")");
                    console.log(res);
                    //console.log('done:', res);
                    ok(res);
                    //console.log('end');
                });
            };

            var errorFn = function (err) {
                console.log('error', err);
            };

            var path = '/services/v1/geocodeservice/geocodeservice.asmx/ReverseGeocode?latitude=' + p.lat + '&longitude=' + p.lng + '&key=AmIrj9J3VEqVnTeA5WHadVN89sO5dvrf9blR6z2HX8npuRMyJYzzXhAR5t2S1ky-&culture=%22en-us%22&format=json';
            console.log(path);
            var req = http.request({
                host: 'dev.virtualearth.net',
                port: 80,
                path: path,
                method: 'GET',
            }, resFn);
            req.on('error', errorFn);
            req.end();

        };
    }
});

app.use('/svc', $data.ODataServer({ type: mySvc, CORS: true }));

app.listen(6789, '127.0.0.1');


