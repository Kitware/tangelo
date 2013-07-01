chat = {};
chat.a = null;
chat.b = null;

$(function () {
    d3.select("#create-a")
        .on("click", function () {
            if (!chat.a) {
                chat.a = window.open("window-a.html");
            }
        });

    d3.select("#create-b")
        .on("click", function () {
            if (!chat.b) {
                chat.b = window.open("window-b.html");
            }
        });
});
