$data.LeafletTrace = L.Control.extend({
    options: {
        position: 'topright',
        autoZIndex: true,
        attribution: 'JayData'
    },

    initialize: function (options) {
        L.setOptions(this, options);

    },

    onAdd: function (map) {
        //this._initLayout();
        //this._update();

        //map
		//    .on('layeradd', this._onLayerChange, this)
		//    .on('layerremove', this._onLayerChange, this);
        var container = this._container = L.DomUtil.create('div', 'leaflet-control-options');
        
        $(container).html('v1.0beta');
        console.log(container);
        return container;
    },

    getAttribution: function() {
        return "JayData";
    },
    logLine: function(log) {
        //$(this._container).prepend("<div>" + log + "</div>");
    },
    log: function(log) {
        //$(this._container).append(log);
    },

});