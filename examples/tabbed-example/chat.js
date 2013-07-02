chat = {};
chat.a = null;
chat.b = null;

function receiveMessage(e) {
    var which,
        color,
        id;

    switch (e.data.type) {
        case "request identity":
            if (e.source === chat.a) {
                id = "a";
            } else if (e.source === chat.b) {
                id = "b";
            } else {
                return;
            }

            e.source.postMessage({type: "identity", identity: id}, "*");
            break;

        case "tab closed":
            chat[e.data.identity] = null;
            break;

        case "message":
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
                .html('<span style="color:' + color + ';"><strong>' + which + ':</strong></span> ' + e.data.msg);
            break;

        default:
            throw "unknown message type '" + e.data.type + "'";
            break;
    }
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
                var which = chat[$("input[name=target]:radio:checked").attr("id")];

                if (which) {
                    d3.select("#error")
                        .html("");

                    which.postMessage({type: "message", msg: this.value}, "*");

                    d3.select("#transcript")
                        .append("div")
                        .classed("row", true)
                        .html("<strong>Me:</strong> " + this.value);

                    d3.select(this)
                        .property("value", "");
                } else {
                    d3.select("#error")
                        .html("<h3 style=\"color:red;\">That tab does not exist; use the buttons to create it.</h3>");
                }
            }
        });
});
