/*jslint browser: true, unparam: true */

/*globals tangelo, CryptoJS, $, d3, escape, FileReader, console */

// This is declared null for now - it will be initialized in the window's
// onready method, as it depends on elements being loaded in the page.
var graph = null;

// Top-level container object for this js file.
var NER = {};

NER.mongo_server = null;

// "nodes" is a table of entity names, mapping to an array position generated
// uniquely by the "counter" variable.  Once the table is complete, the nodes
// table can be recast into an array.
NER.nodes = {};
NER.links = {};
NER.counter = 0;
NER.linkcounter = 0;

// A catalog of NER types found by the analysis.  This will be used to construct
// the color legend at the top of the graph display.
NER.types = {};

// This count will signal when the last ajax request has completed, and graph
// assembly can continue.
NER.num_files = 0;
NER.files_processed = 0;

// This table stores formatted filename information that can be dynamically
// added to in different situations ("processing" to "processed", etc.).
NER.filenames = {};

NER.datasets = [
    {
        option: "Letters from Abbottabad",
        dir: "data/letters-from-abbottabad"
    }
];

NER.customdata = "Custom (use file selector)";

function appendInfo(msg) {
    "use strict";

    var con;

    con = d3.select("#console");
    con.text(con.text() + msg + "\n");
}

function clearAll() {
    "use strict";

    NER.nodes = {};
    NER.links = {};
    NER.counter = 0;
    NER.linkcounter = 0;

    NER.types = {};

    NER.num_files = 0;
    NER.files_processed = 0;
}

// This function can be called with a filename to *generate* an AJAX-success
// callback function to process the contents of some file.  The parameter passed
// into the generator is so that the callback has access to the name of the file
// being processed.
function processFileContents(filename, id, file_hash) {
    "use strict";

    return function (response) {
        var entities,
            li,
            ok,
            doc_index;

        // Check the error code in the AJAX response.  If there is an error,
        // write the error message in the information window and abort the
        // operation.
        if (response.error) {
            appendInfo(response.error);
            if (response.error === "NLTK not installed") {
                if (d3.select(".error-div")[0][0] === null) {
                    d3.select(document.body)
                        .append("div")
                        .classed("error-div", true)
                        .style("font-size", "14pt")
                        .style("position", "fixed")
                        .style("height", "100%")
                        .style("width", "100%")
                        .style("top", "0px")
                        .style("left", "0px")
                        .style("padding-top", "20%")
                        .style("padding-left", "20%")
                        .style("padding-right", "20%")
                        .style("text-align", "center")
                        .html("This app requires the NLTK Python package to be installed.<br>" +
                              "See these <a href=\"http://tangelo.readthedocs.org/en/latest/setup.html#named-entities\">instructions</a> for help setting this up.");
                }
            }
            return;
        }

        // Extract the actual result from the response object.
        entities = response.result;

        // Write a message.
        appendInfo(filename + " processed");

        // If the "store" parameter is set to true, store the data in the
        // database (caching it for future retrieval).
        if (file_hash !== undefined) {
            // Fire an AJAX call that will install the computed data in the DB.
            ok = true;
            $.ajax({
                type: 'POST',
                url: 'nermongo/' + NER.mongo_server + '/xdata/ner-cache',
                data: {
                    file_hash: file_hash,
                    data: JSON.stringify(entities)
                },
                dataType: 'json',
                success: function (resp) {
                    // If there was an error, continue anyway, as the failure
                    // would be in writing an entry to the database, and we
                    // already have the data in hand.
                    if (resp.error) {
                        console.log("error: " + resp.error);
                    }
                }
            });
        }

        // Create an entry for the document itself.
        NER.nodes[filename] = {
            name: filename,
            type: "DOCUMENT",
            count: 1,
            id: NER.counter
        };
        doc_index = NER.counter;
        NER.counter += 1;

        // Augment the count for the DOCUMENT type in the type table.
        NER.types.DOCUMENT = NER.types.DOCUMENT + 1 || 1;

        // Process the entities.
        $.each(entities, function (i, e) {
            var key,
                entity_index,
                link;

            // Place the entity into the global entity list
            // if not already there.
            //
            // Also update the count of this entity.
            key = '["' + e[0] + '","' + e[1] + '"]';
            if (!NER.nodes.hasOwnProperty(key)) {
                // Place the entity into the node table.
                NER.nodes[key] = {
                    name: e[1],
                    type: e[0],
                    count: 1,
                    id: NER.counter
                };

                NER.counter += 1;

                // Augment the type count.
                NER.types[e[0]] = NER.types[e[0]] + 1 || 1;
            } else {
                NER.nodes[key].count += 1;
            }

            entity_index = NER.nodes[key].id;

            // Enter a link into the link list, or just increase the count if
            // the link exists already.
            link = "(" + entity_index + "," + doc_index + ")";
            if (!NER.links.hasOwnProperty(link)) {
                NER.links[link] = {
                    source: entity_index,
                    target: doc_index,
                    count: 1,
                    id: NER.linkcounter
                };

                NER.linkcounter += 1;
            } else {
                NER.links[link].count += 1;
            }
        });

        // Increment the number of successfully processed files; if the number
        // reaches the number of total files to process, launch the final step
        // of assembling the graph.
        NER.files_processed += 1;

        if (NER.files_processed === NER.num_files) {
            graph.assemble(NER.nodes, NER.links, NER.types, NER.nodeSlider.slider("value"));
            graph.recompute(NER.nodeSlider.slider("value"));
            graph.render();
        }
    };
}

function processFile(filename, id) {
    "use strict";

    return function (e) {
        var text,
            file_hash;

        // Grab the text of the file.
        text = e.target.result;

        // Create a "progress" bullet point describing the current
        // AJAX state of this file.

        //var elem = document.createElement("li");
        //elem.innerHTML = "processing " + filename;
        //elem.setAttribute("id", filename.replace(".","-"));
        //elem.setAttribute("class", "processing inprogress");
        //$("#blobs").get(0).appendChild(elem);

        file_hash = CryptoJS.MD5(text).toString();

        // Check to see if the file contents were already processed,
        // by querying the database for the results.  If they are
        // found, retrieve them directly; if not, fire the AJAX call
        // below to compute the results (but db cache the result
        // when it finishes!).
        $.ajax({
            type: 'POST',
            url: 'nermongo/' + NER.mongo_server + '/xdata/ner-cache',
            data: {
                file_hash: file_hash
            },
            dataType: "json",
            success: function (response) {
                var li;

                // Error checking.
                if (response.error) {
                    appendInfo(response.error);
                }

                // Mark the appropriate list item as being processed.
                appendInfo(filename + " processing");

                // Check the response - if it is an empty list, or there was a
                // database error, launch the second AJAX call to directly
                // compute the NER set, and store it in the database.
                if (response.error || response.result.length === 0) {
                    $.ajax({
                        type: 'POST',
                        url: 'ner',
                        data: {
                            text: text
                        },
                        dataType: 'json',
                        success: processFileContents(filename, id, file_hash),
                        error: function () {
                            appendInfo(filename + " processed");
                        }
                    });
                } else {
                    // TODO(choudhury): error checking.  Make sure that response
                    // has only a single element, etc.

                    // Convert the Mongo result into an NER result before
                    // sending it to be processed.  Because the nested list
                    // comes back from Mongo as a string, parse it into a
                    // JavaScript object as well.
                    //
                    // TODO(choudhury): do error checking - if the "error" field
                    // of the response is not null, something must be done.
                    response.result = $.parseJSON(response.result[0].data);

                    // The call to processFileContents() generates a function
                    // (in which the file_hash parameter is OMITTED); the second
                    // invocation calls that function to actually process the
                    // data.
                    processFileContents(filename, id)(response);
                }
            }
        });
    };
}

function generate_id(filename) {
    "use strict";

    // TODO(choudhury): technically, this can lead to identical ids (e.g.,
    // "letter_1.txt" and "letter 1.txt" will both wind up with
    // "letter_1-txt" as their id string).
    return filename.replace(/\./g, "-")
        .replace(/ /g, "_");
}

function handleFileSelect() {
    "use strict";

    var evt,
        files,
        output,
        i,
        f,
        filename,
        id,
        using,
        status,
        msg,
        li,
        reader;

    evt = d3.event;

    // Clear the graph.
    graph.reset();

    // Clear the data.
    clearAll();

    // Set the dataset selector element to show the "custom" item.
    d3.select("#dataset").node().value = NER.customdata;

    // Grab the list of files selected by the user.
    files = evt.target.files;

    // Compute how many of these files will actually be processed for named
    // entities (see comment below for explanation of how the files are vetted).
    NER.num_files = 0;
    $.each(files, function (k, v) {
        if (v.type === '(n/a)' || v.type.slice(0, 5) === 'text/') {
            NER.num_files += 1;
        }
    });

    // Now run through the files, using a callback to load the content from the
    // proper ones and pass it to an ajax call to perform named-entity
    // recognition.
    output = [];
    for (i = 0; i < files.length; i += 1) {
        f = files[i];

        // Create globally usable names to use to refer to the current file.
        filename = escape(f.name);

        // Get a unique id by which to refer to the this file in the html
        // document.
        id = generate_id(f.name);

        // Decide whether to process a selected file or not - accept everything
        // with a mime-type of text/*, as well as those with unspecified type
        // (assume the user knows what they are doing in such a case).
        using = null;
        status = null;
        msg = null;
        if (f.type === '(n/a)') {
            status = "accepted";
            msg = "ok, assuming text";
            using = true;
        } else if (f.type.slice(0, 5) === 'text/') {
            status = "accepted";
            msg = "ok";
            using = true;
        } else {
            status = "rejected";
            msg = "rejected";
            using = false;
        }

        // Create a list item element to represent the file.  Tag it with an id
        // so it can be updated later.
        li = d3.select("#file-info").append("li");
        NER.filenames[filename] = '<span class=filename>' + filename + '</span>';
        appendInfo(filename + " (" + (f.type || "n/a") + ") - " + f.size + " bytes " + (using ? "(ok)" : "(rejected)"));

        if (using) {
            reader = new FileReader();
            reader.onload = processFile(filename, id);
            reader.readAsText(f);
        }
    }
}

function freshFileInput() {
    "use strict";

    var holder;

    holder = d3.select("#file-input-holder");

    holder.selectAll("*")
        .remove();

    holder.append("input")
        .attr("multiple", "true")
        .attr("type", "file")
        .attr("id", "docs")
        .on("change", handleFileSelect);
}

function loaddata() {
    "use strict";

    var callback,
        dir,
        i,
        sel;

    // Determine which option was selected.
    //
    // NOTE: the index will be equal to the length of the available datasets
    // when it is pointing "beyond" all of the dataset choices, i.e., at the
    // custom item.
    sel = d3.select("#dataset").node();
    if (sel.selectedIndex === NER.datasets.length) {
        return;
    }

    // Clear the file input.
    freshFileInput();

    // Get the directory containing the files in the data set.
    /*jslint nomen:true */
    dir = sel.options[sel.selectedIndex].__data__.dir;
    /*jslint nomen:false */

    // Open the json file describing which files to load.
    d3.json(dir + "/control.json", function (data) {
        // Set the number of files to load.
        NER.num_files = data.files.length;

        // Write a callback generator that will construct an id, pass the
        // filename and id to processFile, then immediately invoke the resulting
        // function with a fake event object containing the text to process.
        callback = function (i) {
            return function (text) {
                var e;

                // Pack the text into a form the processFile function will
                // recognize.
                e = {};
                e.target = {};
                e.target.result = text;

                // Call the function.
                processFile(data.files[i], generate_id(data.files[i]))(e);
            };
        };

        // Fire off ajax calls to retrieve the text and pass it to processFile.
        for (i = 0; i < data.files.length; i = i + 1) {
            d3.text(dir + "/" + data.files[i], callback(i));
        }
    });
}

window.onload = function () {
    "use strict";

    // Create control panel.
    $("#control-panel").controlPanel();

    tangelo.config("config.json", function (config, status, error) {
        var popover_cfg;

        if (status !== "OK") {
            tangelo.fatalError("ner.js", "config.json file is required");
        } else if (!config["mongodb-server"]) {
            tangelo.fatalError("ner.js", "config.json must have 'mongodb-server' field");
        }

        NER.mongo_server = config["mongodb-server"];

        // Capture the console element.
        NER.con = d3.select("#console");

        // Enable the popover help items.
        //
        // First create a config object with the common options present.
        popover_cfg = {
            html: true,
            container: "body",
            placement: "top",
            trigger: "hover",
            title: null,
            content: null,
            delay: {
                show: 100,
                hide: 100
            }
        };

        // Dataset pulldown help.
        popover_cfg.content = "A description of the included datasets:<br><br>" +
            "<b>Letters from Abbottabad</b>. " +
            "Correspondence written by Al Qaeda leadership, including Osama bin Laden, " +
            "discovered by the SEALs during the raid in which he was killed.<br><br>";
        $("#dataset-help").popover(popover_cfg);

        // Graph menu help.
        popover_cfg.content = "<b>Scale nodes by frequency</b>. Display the nodes, representing entities, " +
            "with size proportional to the <i>total number of mentions in all the documents</i>.<br><br>" +
            "<b>Thicken links by frequency</b>. Display the links, representing the mention of an entity " +
            "in a document, with thickness proportional to the <i>number of times that entity is mentioned " +
            "in that document</i>.<br><br>" +
            "<b>Render text labels</b>.  Instead of circles to represent entities, use a text placard with " +
            "the name of the entity displayed with text.";
        $("#graph-help").popover(popover_cfg);

        // Activate the dataset select tag, and fill it with entries.
        d3.select("#dataset")
            .on("change", loaddata)
            .data(NER.datasets)
            .append("option")
            .text(function (d) { return d.option; });

        d3.select("#dataset")
            .append("option")
            .text(NER.customdata);

        // Activate the clear button.
        d3.select("#clear")
            .on("click", function () {
                clearAll();
                graph.clear();

                // Clear the file selector, and set the dataset selector to
                // "custom".
                freshFileInput();
                d3.select("#dataset").node().value = NER.customdata;
            });

        graph = (function () {
            var fade_time,
                orignodes,
                origlinks,
                nodes,
                links,
                counter,
                config,
                color,
                legend,
                svg,
                width,
                height,
                nodeCharge,
                textCharge,
                force;

            // Duration of fade-in/fade-out transitions.
            fade_time = 500;

            // Original data as passed to this module by a call to assemble().
            orignodes = {};
            origlinks = {};

            // Data making up the graph.
            nodes = [];
            links = [];

            // A counter to help uniquely identify incoming data from different sources.
            counter = 0;

            // Configuration parameters for graph rendering.
            config = {
                // Whether to make the radius of each node proportional to the number of
                // times it occurs in the corpus.
                nodeScale: false,

                // Whether to thicken a link proportionally to the number of times it
                // occurs in the corpus.
                linkScale: false,

                // Whether to use circles to represent nodes, or text objects.
                useTextLabels: false
            };

            color = d3.scale.category20();
            legend = d3.select("#color-legend");

            svg = d3.select("#graph");

            width = $(window).width();
            height = $(window).height();
            nodeCharge = -120;
            textCharge = -600;
            force = d3.layout.force()
                .linkDistance(30)
                .size([width, height]);

            $(window).resize(function () {
                width = $(window).width();
                height = $(window).height();
                force.size([width, height]);
                force.start();
            });

            return {
                assemble: function (nodedata, linkdata, typedata, nodecount_threshold) {
                    var elemtext,
                        li;

                    // Store copies of the incoming data.
                    orignodes = {};
                    $.each(nodedata, function (k, v) {
                        orignodes[k] = v;
                    });

                    origlinks = {};
                    $.each(linkdata, function (k, v) {
                        origlinks[k] = v;
                    });

                    // Construct a color legend.
                    $("#legend").svgColorLegend({
                        cmap_func: color,
                        xoffset: 10,
                        yoffset: 10,
                        categories: Object.keys(typedata),
                        height_padding: 5,
                        width_padding: 7,
                        text_spacing: 19,
                        legend_margins: {top: 5, left: 5, bottom: 5, right: 5},
                        clear: true
                    });

                    // Read the current state of the option inputs (these might not
                    // be the default values if the user did a "soft" reload of the
                    // page after changing them).
                    this.updateConfig();
                },

                recompute: function (nodecount_threshold) {
                    var fixup;

                    if (nodecount_threshold === undefined) {
                        tangelo.fatalError("ner", "recompute() must be called with a threshold");
                    }

                    // Copy the thresholded nodes over to the local array, and
                    // record their index as we go.  Also make a local copy of the
                    // original, unfiltered data.
                    nodes.length = 0;
                    fixup = {};
                    $.each(orignodes, function (k, v) {
                        if (v.count >= nodecount_threshold || v.type === "DOCUMENT") {
                            fixup[v.id] = nodes.length;
                            nodes.push(v);
                        }
                    });

                    // Copy the link data to the local links array, first checking
                    // to see that both ends of the link are actually present in the
                    // fixup index translation array (i.e., that the node data is
                    // actually present for this threshold value).  Also make a
                    // local copy of the origlinks, unfiltered link data.
                    links.length = 0;
                    $.each(origlinks, function (k, vv) {
                        var v,
                            p;

                        v = {};
                        for (p in vv) {
                            if (vv.hasOwnProperty(p)) {
                                v[p] = vv[p];
                            }
                        }

                        if (fixup.hasOwnProperty(v.source) && fixup.hasOwnProperty(v.target)) {
                            // Use the fixup array to edit the index location of the
                            // source and target.
                            v.source = fixup[v.source];
                            v.target = fixup[v.target];
                            links.push(v);
                        }
                    });
                },

                reset: function () {
                    // Empty the node and link containers, so they can be recomputed
                    // from scratch.
                    svg.select("g#nodes").selectAll("*").remove();
                    svg.select("g#links").selectAll("*").remove();

                    // Recompute the graph connectivity.
                    this.recompute(NER.nodeSlider.slider("value"));

                    // Re-render.
                    this.render();
                },

                clear: function () {
                    // Clear the svg elements.
                    svg.select("g#nodes").selectAll("*").remove();
                    svg.select("g#links").selectAll("*").remove();

                    // Make the graph forget its connectivity data.
                    origlinks = {};
                    orignodes = {};
                    links = [];
                    nodes = [];
                },

                recenter: function () {
                    // Compute the average position of the nodes, and transform the
                    // entire svg element so that this position is the center of the
                    // element.

                    var avg_x,
                        avg_y,
                        center_x,
                        center_y,
                        translate;

                    // If there are no nodes, return right away.
                    if (nodes.length === 0) {
                        return;
                    }

                    // Compute the average position.
                    avg_x = 0;
                    avg_y = 0;

                    $.each(nodes, function (i, d) {
                        avg_x += d.x;
                        avg_y += d.y;
                    });

                    avg_x /= nodes.length;
                    avg_y /= nodes.length;

                    // Compute the svg canvas's center point.
                    center_x = d3.select("#graph")
                                .style("width");
                    center_y = d3.select("#graph")
                                .style("height");

                    // Extract the numeric portion of the size (the last two
                    // characters should read "px").
                    center_x = +center_x.slice(0, -2) / 2.0;
                    center_y = +center_y.slice(0, -2) / 2.0;

                    // Translate the average position to the center of the canvas.
                    translate = "translate(" + (center_x - avg_x) + ", " + (center_y - avg_y) + ")";
                    d3.select("g#nodes")
                        .attr("transform", translate);
                    d3.select("g#links")
                        .attr("transform", translate);
                },

                render: function () {
                    var link,
                        node,
                        charge,
                        scaler,
                        that,
                        cards;

                    link = svg.select("g#links").selectAll("line.link")
                        .data(links, function (d) { return d.id; });

                    link.enter().append("line")
                        .classed("link", true)
                        .style("opacity", 0.0)
                        .style("stroke-width", 0.0)
                        .transition()
                        .duration(fade_time)
                        .style("opacity", 0.5)
                        .style("stroke-width", this.linkScalingFunction());

                    link.exit()
                        .transition()
                        .duration(fade_time)
                        .style("opacity", 0.0)
                        .style("stroke-width", 0.0)
                        .remove();

                    // The base selector is "*" to allow for selecting either
                    // "circle" elements or "text" elements (depending on which
                    // rendering mode we are in).
                    node = d3.select("g#nodes").selectAll("*.node")
                        .data(nodes, function (d) { return d.id; });


                    // Compute the nodal charge based on the type of elements, and
                    // their size.
                    charge = config.useTextLabels ? textCharge : nodeCharge;
                    if (config.nodeScale) {
                        force.charge(function (n) { return 2 * Math.sqrt(n.count) * charge; });
                    } else {
                        force.charge(charge);
                    }

                    // Create appropriate SVG elements to represent the nodes, based
                    // on the current rendering mode.
                    if (config.useTextLabels) {
                        scaler = this.nodeScalingFunction();
                        cards = node.enter().append("g")
                            .attr("id", function (d) { return d.id; })
                            .attr("scale", function (d) { return "scale(" + Math.sqrt(scaler(d)) + ")"; })
                            .attr("translate", "translate(0,0)")
                            .classed("node", true)
                            .call(force.drag);

                        cards.append("text")
                            .text(function (d) { return d.name; })
                            .style("fill", "black")
                            .datum(function (d) {
                                // Augment the selection's data with the bounding
                                // box of the text elements.
                                d.bbox = this.getBBox();
                            });

                        cards.insert("rect", ":first-child")
                            .attr("width", function (d) { return d.bbox.width; })
                            .attr("height", function (d) { return d.bbox.height; })
                            .attr("y", function (d) { return -0.75 * d.bbox.height; })
                            .style("stroke", function (d) { return color(d.type); })
                            .style("stroke-width", "2px")
                            .style("fill", function (d) { return d.type === "DOCUMENT" ? color("DOCUMENT") : "#e5e5e5"; })
                            .style("fill-opacity", "0.8");
                    } else {
                        node.enter().append("circle")
                            .classed("node", true)
                            .attr("r", this.nodeScalingFunction())
                            .attr("cx", width / 2)
                            .attr("cy", height / 2)
                            .style("fill", function (d) { return color(d.type); })
                            .style("opacity", 0.0)
                            .call(force.drag)
                            .transition()
                            .duration(fade_time)
                            .style("opacity", 1.0);

                        node.append("title")
                            .text(function (d) { return d.name; });
                    }

                    node.exit()
                        .transition()
                        .duration(fade_time)
                        .style("opacity", 0.0)
                        .remove();

                    force.stop()
                        .nodes(nodes)
                        .links(links)
                        .start();

                    that = this;
                    force.on("tick", function () {
                        link.attr("x1", function (d) { return d.source.x; })
                            .attr("y1", function (d) { return d.source.y; })
                            .attr("x2", function (d) { return d.target.x; })
                            .attr("y2", function (d) { return d.target.y; });

                        if (config.useTextLabels) {
                            //node.attr("x", function(d) { return d.x; })
                            //.attr("y", function(d) { return d.y; });
                            node.attr("translate", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
                                .attr("transform", function () { return this.getAttribute("translate") + " " + this.getAttribute("scale"); });
                        } else {
                            node.attr("cx", function (d) { return d.x; })
                                .attr("cy", function (d) { return d.y; });
                        }

                        that.recenter();
                    });
                },

                updateConfig: function () {
                    var check;

                    // Sweep through the configuration elements and set the boolean
                    // flags appropriately.
                    check = $("#nodefreq")[0];
                    config.nodeScale = check.checked;

                    check = $("#linkfreq")[0];
                    config.linkScale = check.checked;

                    check = $("#usetext")[0];
                    config.useTextLabels = check.checked;
                },

                applyConfig: function () {
                    var scaler;

                    // Reset the attributes on the nodes and links according to
                    // the current config settings.
                    svg.selectAll("g#links line.link")
                        .transition()
                        .duration(2000)
                        .style("stroke-width", this.linkScalingFunction());

                    if (config.useTextLabels) {
                        scaler = this.nodeScalingFunction(); // Capture here because 'this' content is gone when we need to retrieve this function.
                        svg.selectAll("g#nodes *.node")
                            .transition()
                            .duration(1000)
                            .attr("scale", function (d) { return "scale(" + Math.sqrt(scaler(d)) + ")"; })
                            .attr("transform", function () { return this.getAttribute("translate") + " " + this.getAttribute("scale"); });
                        //.attr("transform", function() { return this.getAttribute("translate"); });
                        //.attr("transform", function() { return this.getAttribute("scale"); });
                    } else {
                        svg.selectAll("g#nodes circle.node")
                            .transition()
                            .duration(1000)
                            .attr("r", this.nodeScalingFunction());
                    }
                },

                nodeScalingFunction: function () {
                    var base,
                        factor,
                        ret;

                    base = config.useTextLabels ? 0.5 : 5;
                    factor = config.useTextLabels ? 0.5 : 1;
                    if (config.nodeScale) {
                        ret = function (d) { return base + factor * Math.log(Math.sqrt(d.count)); };
                    } else {
                        ret = function () { return base; };
                    }

                    return ret;
                },

                linkScalingFunction: function () {
                    var ret;

                    if (config.linkScale) {
                        ret = function (d) { return Math.sqrt(d.count); };
                    } else {
                        ret = 1;
                    }

                    return ret;
                }
            };
        }());

        // Initialize the slider for use in filtering.
        //
        // Set the slider to "5" (to give a reasonable amount of data as the
        // default).
        NER.nodeSlider = $("#slider");
        NER.nodeSlider.slider({
            max: 10,
            value: 5,
            change: function (evt, ui) {
                graph.recompute(ui.value);
                graph.render();
            },
            slide: (function () {
                var display = d3.select("#value");

                return function (evt, ui) {
                    display.html(ui.value);
                };
            }())
        });

        // Bootstrap showing the slider value here (none of the callbacks in the
        // slider API help).
        d3.select("#value").html(NER.nodeSlider.slider("value"));

        // Install a new file input.
        //
        // NOTE: this is done via a function so we have a way to "clear" the
        // filename appearing inside it, when the user uses the dropdown menu to
        // select a prepared dataset, etc.
        freshFileInput();

        // Trigger the loading of the default selected dataset from the dropdown.
        loaddata();
    });
};
