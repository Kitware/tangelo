/*global $, Backbone, console */

$(function () {
    "use strict";

    var app, MyRouter;

    function go(event, id) {
        console.log("go");
        var uri = id === "home" ? "" : id;
        app.navigate(uri, {trigger: true});
        event.returnValue = false;
        if (event.preventDefault) {
            event.preventDefault();
        }
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        return false;
    }

    function goto(id) {
        $("#home").hide();
        $("#examples").hide();
        $("#support").hide();
        $("#" + id).fadeIn(400);
        $(".nav > li").removeClass("active");
        $("#nav-" + id).addClass("active");
    }

    MyRouter = Backbone.Router.extend({
        routes: {
            "": "home",
            "examples": "examples",
            "support": "support"
        },
        home: function () { goto("home"); },
        examples: function () { goto("examples"); },
        support: function () { goto("support"); }
    });
    app = new MyRouter();
    app.navigate("/");
    Backbone.history.start({
        //pushState: true,
        root: "/"
    });
});
