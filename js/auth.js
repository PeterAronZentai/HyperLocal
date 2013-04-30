function initAuth() {
    hello.init({
        facebook: '439026716191124',
        google: '449285537332-jkcc38anllj53up1frq2cjjockgpct5i.apps.googleusercontent.com'
    });
    hello.subscribe('auth.login', function (auth) {
        // call user information, for the given network
        console.log("authlogin event", auth);
        try {
            hello.api(auth.network + '/me', function (r) {
                if (!r.id || !!document.getElementById(r.id)) {
                    hello.logout();
                    return;
                }
                //var target = document.getElementById("profile_"+ auth.network );
                //target.innerHTML = '<img src="'+ r.picture +'" /> Hey '+r.name;
                window.logedInUser = r;
                sendMessage("info", r.name + " logged in");
                console.log(r);
            });
        } catch (e) {
            hello.logout();
        }
    });
    hello.subscribe('auth.update', function (auth) {
        console.log("auth.update", auth);
        window.logedInUser = null;
    });
    hello.subscribe('auth.logout', function (auth) {
        console.log("logout event", auth);
        window.logedInUser = null;
    });

}
function ensureAuthenticate() {
    window.authDeferred = new $.Deferred();
    if (logedIn()) {
        window.authDeferred.resolve(window.logedInUser);
    } else {
        $('#login').foundation('reveal', 'open');
    }
    return window.authDeferred;
}
function logedIn() {
    var gLogin = false;
    var gSession = hello.getAuthResponse('google');
    if (gSession && !gSession.error) { gLogin = true; }

    var fLogin = false;
    var fSession = hello.getAuthResponse('facebook');
    if (fSession && !fSession.error) { fLogin = true; }

    if ((gLogin || fLogin) && !window.logedInUser) {
        hello.logout();
        return false;
    }

    return gLogin || fLogin;
}
function doLogin(network) {
    hello.login(network, function (auth) {
        if (auth.authResponse && window.authDeferred) {
            window.authDeferred.resolve(window.logedInUser);
        } else {
            if (window.authDeferred) {
                window.authDeferred.reject();
            }
        }
    });
    $('#login').foundation('reveal', 'close');
}
function closeLoginPopup() {
    $('#login').foundation('reveal', 'close');
    if (window.authDeferred) {
        window.authDeferred.reject();
    }
}