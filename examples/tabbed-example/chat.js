chat = {};
chat.a = null;
chat.b = null;

function receiveMessage(e) {
    var which,
        color;

    switch (e.source) {
        case chat.a:
            which = "A";
            color = "red";
            break;

        case chat.b:
            which = "B";
            color = "blue";
            break;

        default:
            console.log("message received from unknown source");
            return;
            break;
    }

    d3.select("#transcript")
        .append("div")
        .classed("row", true)
        .html('<span style="color:' + color + ';"><strong>' + which + ':</strong></span> ' + e.data);
}

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

    window.addEventListener("message", receiveMessage);

    d3.select("#text")
        .on("keyup", function () {
            if (d3.event.keyCode === 13) {
                chat[$("input[name=target]:radio:checked").attr("id")].postMessage(this.value, "*");

                d3.select("#transcript")
                    .append("div")
                    .classed("row", true)
                    .html("<strong>Me:</strong> " + this.value);

                d3.select(this)
                    .property("value", "");
            }
        });
});
