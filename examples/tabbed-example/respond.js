function receiveMessage(e) {
    if (e.source !== window.opener) {
        return;
    }

    d3.select("#transcript")
        .append("div")
        .html("<span style=\"color:blue\"><strong>You:</strong></span> " + e.data);
}

$(function() {
    if (!window.opener) {
        document.write("ERROR: window was not opened correctly.  Please go <a href=index.html>here</a> and try again.");
    }

    d3.select("#text")
        .on("keyup", function () {
            var e = d3.event;

            if (e.keyCode === 13) {
                window.opener.postMessage(this.value, "*");

                d3.select("#transcript")
                    .append("div")
                    .html("<strong>Me:</strong> " + this.value);

                d3.select(this)
                    .property("value", "");
            }
        });

    window.addEventListener("message", receiveMessage);
});
