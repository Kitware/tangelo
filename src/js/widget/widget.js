/*jslint browser: true */

(function (tangelo) {
    tangelo.widget.setOptionMethod = function (key, value) {
        if (this._notAccessors.indexOf(key) === -1) {
            this._super(key, tangelo.accessor(value));
        } else {
            this._super(key, value);
        }
    };

    tangelo.widget.setOptionsMethod = function (options) {
        var that = this;

        $.each(options, function (key, value) {
            that._setOption(key, value);
        });

        this._update();
    };
}(window.tangelo));
