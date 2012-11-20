// This is declared null for now - it will be initialized in the window's
// onready method, as it depends on elements being loaded in the page.
var graph = null;

// Top-level container object for this js file.
var NER = {};

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

function processFile(filename, id){
    return function(e){
        // Grab the text of the file.
        var text = e.target.result;

        // Create a "progress" bullet point describing the current
        // AJAX state of this file.

        //var elem = document.createElement("li");
        //elem.innerHTML = "processing " + filename;
        //elem.setAttribute("id", filename.replace(".","-"));
        //elem.setAttribute("class", "processing inprogress");
        //$("#blobs").get(0).appendChild(elem);

        // Mark the appropriate list item as being processed.
        var li = d3.select("#" + id);
        li.html(NER.filenames[filename] + " processing")
            .classed("processing inprogress", true);

        var file_hash = CryptoJS.MD5(text).toString();

        // Check to see if the file contents were already processed,
        // by querying the database for the results.  If they are
        // found, retrieve them directly; if not, fire the AJAX call
        // below to compute the results (but db cache the result
        // when it finishes!).
        $.ajax({
            type: 'POST',
            url: '/service/mongo/xdata/ner-cache',
            data: {
                file_hash: file_hash
            },
            success: function(data){
                // Check the response - if it is blank, launch the
                // second AJAX call to directly compute the NER set,
                // and store it in the database.
                if(data == '[]'){
                    $.ajax({
                        type: 'POST',
                        url: '/service/NER',
                        data: {
                            text: text
                        },
                        dataType: 'text',
                        success: processFileContents(filename, id, file_hash),
                        error: function(){
                            $("#" + filename.replace(".","-")).removeClass("inprogress").addClass("failed").get(0).innerHTML = filename + " processed";
                        }
                    });
                }
                else{
                    // The data returned from the DB is in MongoDB format.  Read
                    // it into a JSON object, then extract the payload.
                    var jsdata = $.parseJSON(data);

                    // TODO(choudhury): error checking.  Make sure
                    // that "jsdata" has only a single element, etc.

                    // The call to processFileContents() generates a
                    // function (in which the file_hash parameter is
                    // OMITTED); the second invocation calls that
                    // function to actually process the data.
                    processFileContents(filename, id)(jsdata[0].data);
                }
            }
        });
    };
}

// This function can be called with a filename to *generate* an AJAX-success
// callback function to process the contents of some file.  The parameter passed
// into the generator is so that the callback has access to the name of the file
// being processed.
function processFileContents(filename, id, file_hash){
    return function(data){
        var li = d3.select("#" + id)
            .classed("inprogress", false)
            .classed("processing done", true);
        li.html(NER.filenames[filename] + ' processed');

        // If the "store" parameter is set to true, store the data in the
        // database (caching it for future retrieval).
        if(file_hash !== undefined){
            // Fire an AJAX call that will install the computed data in the DB.
            $.ajax({
                type: 'POST',
                url: '/service/mongo/xdata/ner-cache',
                data: {
                    file_hash: file_hash,
                data: data
                }
            });
        }

        // Create an entry for the document itself.
        NER.nodes[filename] = {
            name: filename,
            type: "DOCUMENT",
            count: 1,
            id: NER.counter++
        };
        var doc_index = NER.counter - 1;

        // Augment the count for the DOCUMENT type in the type table.
        NER.types["DOCUMENT"] = NER.types["DOCUMENT"] + 1 || 1;

        // Extract the JSON object from the AJAX response.
        var entities = $.parseJSON(data);

        // Process the entities.
        $.each(entities, function(i, e){
            // Place the entity into the global entity list
            // if not already there.
            //
            // Also update the count of this entity.
            var key = '["' + e[0] + '","' + e[1] + '"]';
            if(!NER.nodes.hasOwnProperty(key)){
                // Place the entity into the node table.
                NER.nodes[key] = {
                    name: e[1],
            type: e[0],
            count: 1,
            id: NER.counter++
                };

            // Augment the type count.
            NER.types[e[0]] = NER.types[e[0]] + 1 || 1;
            }
            else{
                NER.nodes[key].count++;
            }
        var entity_index = NER.nodes[key].id;

        // Enter a link into the link list, or just increase the count if
        // the link exists already.
        var link = "(" + entity_index + "," + doc_index + ")";
        if(!NER.links.hasOwnProperty(link)){
            NER.links[link] = {
                source: entity_index,
                target: doc_index,
                count: 1,
                id: NER.linkcounter++
            };
        }
        else{
            NER.links[link].count++;
        }
        });

        // Increment the number of successfully processed files; if the number
        // reaches the number of total files to process, launch the final step
        // of assembling the graph.
        ++NER.files_processed;

        if(NER.files_processed == NER.num_files){
            graph.assemble(NER.nodes, NER.links, NER.types, NER.nodeSlider.getValue());
            graph.recompute(NER.nodeSlider.getValue());
            graph.render();
        }
    };
}

function handleFileSelect(evt){
    // Grab the list of files selected by the user.
    var files = evt.target.files;

    // Compute how many of these files will actually be processed for named
    // entities (see comment below for explanation of how the files are vetted).
    NER.num_files = 0;
    $.each(files, function(k, v){
        if(v.type == '(n/a)' || v.type.slice(0,5) == 'text/'){
            NER.num_files++;
        }
    });

    // Now run through the files, using a callback to load the content from the
    // proper ones and pass it to an ajax call to perform named-entity
    // recognition.
    var output = [];
    for(var i=0; i<files.length; i++){
        var f = files[i];

        // Create globally usable names to use to refer to the current file.
        var filename = escape(f.name);
        var id = filename.replace(".", "-");

        // Decide whether to process a selected file or not - accept everything
        // with a mime-type of text/*, as well as those with unspecified type
        // (assume the user knows what they are doing in such a case).
        var using = null;
        var status = null;
        var msg = null;
        if(f.type == '(n/a)'){
            status = "accepted";
            msg = "ok, assuming text";
            using = true;
        }
        else if(f.type.slice(0,5) == 'text/'){
            status = "accepted";
            msg = "ok";
            using = true;
        }
        else{
            status = "rejected";
            msg = "rejected";
            using = false;
        }

        // Create a list item element to represent the file.  Tag it with an id
        // so it can be updated later.
        var li = d3.select("#file-info").append("li");
        NER.filenames[filename] = '<span class=filename>' + filename + '</span>';
        li.attr("id", id)
            .classed("rejected", !using)
            .html(NER.filenames[filename] + '<span class=filename>(' + (f.type || 'n/a') + ')</span> - ' + f.size + ' bytes ' + (using ? '<span class=ok>(ok)</span>' : '<span class=rejected>(rejected)</span>') );

        if(using){
            var reader = new FileReader();
            reader.onload = processFile(filename, id);
            reader.readAsText(f);
        }
    }

    // Remove the "rejected" list items by fading them away.
    d3.selectAll("li.rejected")
        .transition()
        .delay(1000)
        .duration(2000)
        .style("opacity", 0.0)
        .style("height", "0px")
        .remove();
}

window.onload = function(){
    graph = (function(){
        // Duration of fade-in/fade-out transitions.
        var fade_time = 500;

        // Original data as passed to this module by a call to assemble().
        var orignodes = {};
        var origlinks = {};

        // Data making up the graph.
        var nodes = [];
        var links = [];

        // A counter to help uniquely identify incoming data from different sources.
        var counter = 0;

        // Configuration parameters for graph rendering.
        var config = {
            // Whether to make the radius of each node proportional to the number of
            // times it occurs in the corpus.
            nodeScale: false,

          // Whether to thicken a link proportionally to the number of times it
          // occurs in the corpus.
          linkScale: false,

         // Whether to use circles to represent nodes, or text objects.
         useTextLabels: false
        };

        var color = d3.scale.category20();
        var legend = d3.select("#color-legend");

        var svg = d3.select("#graph");

        var width = svg.attr("width"),
            height = svg.attr("height");

        var nodeCharge = -120;
        var textCharge = -600;
        var force = d3.layout.force()
            .linkDistance(30)
            .size([width, height]);

        return {
            assemble: function(nodedata, linkdata, typedata, nodecount_threshold){
                // Store copies of the incoming data.
                orignodes = {};
                $.each(nodedata, function(k,v){
                    orignodes[k] = v;
                });

                origlinks = {};
                $.each(linkdata, function(k,v){
                    origlinks[k] = v;
                });

                // Loop through the types and place a color swatch in the legend
                // area for each one.
                $.each(typedata, function(t){
                    var elemtext = d3.select(document.createElement("div"))
                    .style("border", "solid black 1px")
                    .style("background", color(t))
                    .style("display","inline-block")
                    .style("width", "20px")
                    .html("&nbsp;")
                    .node().outerHTML;

                    var li = legend.append("li")
                    .html(elemtext + "&nbsp;" + t);
                });

                // Read the current state of the option inputs (these might not
                // be the default values if the user did a "soft" reload of the
                // page after changing them).
                this.updateConfig();
            },

            recompute: function(nodecount_threshold){
                if(typeof nodecount_threshold === "undefined"){
                    throw "recompute must be called with a threshold!"
                }

                // Copy the thresholded nodes over to the local array, and
                // record their index as we go.  Also make a local copy of the
                // original, unfiltered data.
                nodes.length = 0;
                var fixup = {};
                $.each(orignodes, function(k,v){
                    if(v.count >= nodecount_threshold || v.type === "DOCUMENT"){
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
                $.each(origlinks, function(k,vv){
                    var v = {};
                    for(p in vv){
                        if(vv.hasOwnProperty(p)){
                            v[p] = vv[p];
                        }
                    }

                    if(fixup.hasOwnProperty(v.source) && fixup.hasOwnProperty(v.target)){
                        // Use the fixup array to edit the index location of the
                        // source and target.
                        v.source = fixup[v.source];
                        v.target = fixup[v.target];
                        links.push(v);
                    }
                });
            },

            reset: function(){
                // Empty the node and link containers, so they can be recomputed
                // from scratch.
                svg.select("g#nodes").selectAll("*").remove();
                svg.select("g#links").selectAll("*").remove();

                // Recompute the graph connectivity.
                this.recompute(NER.nodeSlider.getValue());

                // Re-render.
                this.render();
            },

            render: function(){
                var link = svg.select("g#links").selectAll("line.link")
                    .data(links, function(d) { return d.id; });

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
                var node = d3.select("g#nodes").selectAll("*.node")
                    .data(nodes, function(d) { return d.id; });


                // Compute the nodal charge based on the type of elements, and
                // their size.
                var charge = config.useTextLabels ? textCharge : nodeCharge;
                if(config.nodeScale){
                    force.charge(function(n) { return 2*Math.sqrt(n.count)*charge; });
                }
                else{
                    force.charge(charge);
                }

                // Create appropriate SVG elements to represent the nodes, based
                // on the current rendering mode.
                if(config.useTextLabels){
                    var scaler = this.nodeScalingFunction();
                    var cards = node.enter().append("g")
                        .attr("id", function(d) { return d.id; })
                        .attr("scale", function(d) { return "scale(" + scaler(d) + ")";})
                        .attr("translate", "translate(0,0)")
                        .classed("node", true)
                        .call(force.drag);

                    cards.append("text")
                        .text(function(d) { return d.name; })
                        .style("fill", "black")
                        .datum(function(d){
                            // Augment the selection's data with the bounding
                            // box of the text elements.
                            d.bbox = this.getBBox();
                        });

                    cards.insert("rect", ":first-child")
                        .attr("width", function(d) { return d.bbox.width; })
                        .attr("height", function(d) { return d.bbox.height; })
                        .attr("y", function(d) { return -0.75*d.bbox.height; })
                        .style("stroke", function(d) { return color(d.type); })
                        .style("stroke-width", "2px")
                        .style("fill", function(d) { return d.type === "DOCUMENT" ? color("DOCUMENT") : "#e5e5e5"; })
                        .style("fill-opacity", "0.8");
                }
                else{
                    node.enter().append("circle")
                        .classed("node", true)
                        .attr("r", this.nodeScalingFunction())
                        .attr("cx", width/2)
                        .attr("cy", height/2)
                        .style("fill", function(d) { return color(d.type); })
                        .style("opacity", 0.0)
                        .call(force.drag)
                        .transition()
                        .duration(fade_time)
                        .style("opacity", 1.0);

                    node.append("title")
                        .text(function(d) { return d.name; });
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

                force.on("tick", function(){
                    link.attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });

                if(config.useTextLabels){
                    //node.attr("x", function(d) { return d.x; })
                    //.attr("y", function(d) { return d.y; });
                    node.attr("translate", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                    //.attr("transform", function() { return this.getAttribute("scale") + " " + this.getAttribute("translate"); });
                    .attr("transform", function() { return this.getAttribute("translate") + " " + this.getAttribute("scale"); });

                }
                else{
                    node.attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; });
                }
                });
            },

            updateConfig: function(){
                    // Sweep through the configuration elements and set the boolean
                    // flags appropriately.
                    var check = $("#nodefreq")[0];
                    config.nodeScale = check.checked;

                    check = $("#linkfreq")[0];
                    config.linkScale = check.checked;        

                    check = $("#usetext")[0];
                    config.useTextLabels = check.checked;
                },

                applyConfig: function(){
                    // Reset the attributes on the nodes and links according to
                    // the current config settings.
                    svg.selectAll("g#links line.link")
                        .transition()
                        .duration(2000)
                        .style("stroke-width", this.linkScalingFunction());

                    if(config.useTextLabels){
                        var scaler = this.nodeScalingFunction(); // Capture here because 'this' content is gone when we need to retrieve this function.
                        svg.selectAll("g#nodes *.node")
                            .transition()
                            .duration(1000)
                            .attr("scale", function(d) { return "scale(" + scaler(d) + ")"; })
                            .attr("transform", function() { return this.getAttribute("translate") + " " + this.getAttribute("scale"); });
                            //.attr("transform", function() { return this.getAttribute("translate"); });
                            //.attr("transform", function() { return this.getAttribute("scale"); });
                    }
                    else{
                        svg.selectAll("g#nodes circle.node")
                            .transition()
                            .duration(1000)
                            .attr("r", this.nodeScalingFunction());
                    }
                },

                nodeScalingFunction: function(){
                    var base = config.useTextLabels ? 1 : 5;
                    if(config.nodeScale){
                        return function(d) { return base*Math.sqrt(d.count); };
                    }
                    else{
                        return function() { return base; };
                    }
                },

                linkScalingFunction: function(){
                    if(config.linkScale){
                        return function(d) { return Math.sqrt(d.count); };
                    }
                    else{
                        return 1;
                    }
                }
        };
    })();

    // Initialize the slider for use in filtering.
    var sliderInit = function(sliderId, displayId, callback){
        var slider = $("#" + sliderId);
        var display = d3.select("#" + displayId);

        var config = {
            change: function(e, ui){
                if(callback){
                    callback(ui.value);
                }
            },

            slide: function(e, ui){
                display.html(ui.value);
            }
        };

        return {
            setConfig: function() { slider.slider(config); },
            setMax: function(max) { config.max = max; },
            getValue: function() { return slider.slider("value"); }
        };
    };

    NER.nodeSlider = sliderInit("slider", "value", function(v) { graph.recompute(v); graph.render(); });
    NER.nodeSlider.setConfig();

    // Bootstrap showing the slider value here (none of the callbacks in the
    // slider API help).
    d3.select("#value").html($("#slider").slider("value"));

    document.getElementById('docs').addEventListener('change', handleFileSelect, false);

    // TODO(choudhury): this is just testing code - get rid of it at the right
    // time.
    var h = barchart.barchart("#graph", [50, 60]);
};
