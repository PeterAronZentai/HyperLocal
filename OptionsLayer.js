$data.NetworkIndicator  = L.Control.extend({
    options: {
        position: 'topleft',
        autoZIndex: true
    },

    initialize: function (options) {
        L.setOptions(this, options);

    },

    onAdd: function (map) {
        //this._initLayout();
        //this._update();

        var container = this._container = L.DomUtil.create('div', 'leaflet-bar leaflet-control-network');
        return container;
    },
    setVisible: function (v) {
        if (v) {
            $(this._container).removeClass('hidden');
        } else {
            $(this._container).addClass('hidden');
        }
    },
    beginProcess: function (process) {
        var indicator = $("<div style='font-size: 8pt'><img src='ajax-loader.gif' /></div>");
        $(this._container).append(indicator);

        indicator.complete = function (message) {
            if (message) {
                $(indicator).html(message);
                window.setTimeout(function () {
                    $(indicator).remove();
                }, 2000);
            } else {
                $(indicator).remove();
            }
            
        }

        return indicator;
    },

    _initLayout: function () {
    }
});

$data.EditMode = L.Control.extend({
    options: {
        position: 'topleft',
        autoZIndex: true
    },

    initialize: function (options) {
        L.setOptions(this, options);
    },

    onAdd: function (map) {
        //this._initLayout();
        //this._update();
        var container = this._container = L.DomUtil.create('div', 'leaflet-bar leaflet-control-edit-switch ');
        $(container).append("<center><i href='#' class='foundicon-edit'></i></center>");
        var options = this.options;
        $(container).on("click", function () {
            $(container).toggleClass("active");
            options.app.toggleEditMode();
            return false;
        });
        return container;
    },
    setVisible: function (v) {
        if (v) {
            $(this._container).removeClass('hidden');
        } else {
            $(this._container).addClass('hidden');
        }
    },

});

$data.MapSearch = L.Control.extend({
    options: {
        position: 'topright',
        autoZIndex: true
    },

    initialize: function (options) {
        L.setOptions(this, options);
    },

    onAdd: function (map) {
        //this._initLayout();
        //this._update();
        var container = this._container = L.DomUtil.create('div', 'leaflet-bar leaflet-control-search ');
        //<a class="foundicon-search" href="#"></a>
        $(container).append("<span class='foundicon-search'></span><span id='searchDisplay'></span>");
        var options = this.options;
        $(container).on("click", function () {
            toggleMap();
            $.observable(app).setProperty("items", app.currentOptions.points);
            return false;
        });
        return container;
    },
});