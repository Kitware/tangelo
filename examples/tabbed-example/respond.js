var respond = {};
respond.identity = null;

function receiveMessage(e) {
    if (e.source !== window.opener) {
        return;
    }

    switch (e.data.type) {
        case "message":
            d3.select("#transcript")
                .append("div")
                .html("<span style=\"color:blue\"><strong>You:</strong></span> " + e.data.msg);
            break;

        case "identity":
            respond.identity = e.data.identity;
            break;

        default:
            throw "unknown message type '" + e.data.type + "'";
            break;
    }
}

$(function() {
    if (!window.opener) {
        document.write("ERROR: window was not opened correctly.  Please go <a href=index.html>here</a> and try again.");
    }

    d3.select("#text")
        .on("keyup", function () {
            var e = d3.event;

            if (e.keyCode === 13) {
                window.opener.postMessage({type: "message", msg: this.value}, "*");

                d3.select("#transcript")
                    .append("div")
                    .html("<strong>Me:</strong> " + this.value);

                d3.select(this)
                    .property("value", "");
            }
        });

    window.addEventListener("message", receiveMessage);

    window.opener.postMessage({type: "request identity"}, "*");

    window.onunload = function () {
        window.opener.postMessage({type: "tab closed", identity: respond.identity}, "*");
    };
});
