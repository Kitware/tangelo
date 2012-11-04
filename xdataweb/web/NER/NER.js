// Top-level container object for this js file.
var NER = {};

// "nodes" is a table of entity names, mapping to an array position generated
// uniquely by the "counter" variable.  Once the table is complete, the nodes
// table can be recast into an array.
NER.nodes = {};
//NER.docs = {};
NER.links = {};
NER.counter = 0;

// This count will signal when the last ajax request has completed, and graph
// assembly can continue.
NER.num_files = 0;
NER.files_processed = 0;

function assembleGraph(){
    // Create a graph object.
    var g = {};

    // Copy the links over into an array within the graph object.
    g.links = [];
    $.each(NER.links, function(k, v){
        g.links.push(v);
    });

    // Do the same for the nodes, but do two additional things:
    //
    // 1. When extracting an object from the NER.nodes table, remove the "index"
    //    property, as it will no longer be needed after final placement of the
    //    node.
    //
    // 2. Place the node object into the place in the array indexed by that
    //    "index" property.  This ensures that the references in the link list
    //    are to the proper nodes.
    //
    // Start by creating an empty array of length equal to the number of total
    // entities.
    g.nodes = Array(Object.keys(NER.nodes).length);

    // Now plop each entity into its proper place.
    $.each(NER.nodes, function(k, v){
        var i = v.index;
        delete v.index;
        g.nodes[i] = v;
    });

    return g;
}

function renderGraph(g){
    //console.log(JSON.stringify(g));

    var width = 960,
        height = 500;

    var color = d3.scale.category20();

    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(30)
        .size([width, height]);

    var svg = d3.select("#graph").append("svg")
        .attr("width", width)
        .attr("height", height);

    force
        .nodes(g.nodes)
        .links(g.links)
        .start();

    var link = svg.selectAll("line.link")
        .data(g.links)
      .enter().append("line")
        .attr("class", "link")
        .style("stroke-width", function(d) { return Math.sqrt(d.count); });

    var node = svg.selectAll("circle.node")
        .data(g.nodes)
      .enter().append("circle")
        .attr("class", "node")
        .attr("r", 5) // TODO(choudhury): make the radius dependent on the node count.
        .style("fill", function(d) { return color(d.type); })
        .call(force.drag);

    node.append("title")
        .text(function(d) { return d.node; }); // TODO(choudhury): the field "node" should be renamed to "name".

    force.on("tick", function(){
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

    });
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
    console.log(NER.num_files + " files to process");

    // Now run through the files, using a callback to load the content from the
    // proper ones and pass it to an ajax call to perform named-entity
    // recognition.
    var output = [];
    for(var i=0; i<files.length; i++){
        var f = files[i];

        // Decide whether to process a selected file or not - accept everything
        // with a mime-type of text/*, as well as those with unspecified type
        // (assume the user knows what they are doing in such a case).
        var using = null;
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
        output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ', f.size, ' bytes ', f.type == 'text/plain' ? '<span class=ok>(ok)</span>' : '<span class="rejected">(rejected)</span>');

        if(using){
            var reader = new FileReader();
            reader.onload = (function(file){
                return function(e){
                    var filename = escape(file.name);
                    console.log(filename);

                    // Grab the text of the file.
                    var text = e.target.result;

                    // Create a "progress" bullet point describing the current
                    // AJAX state of this file.
                    var elem = document.createElement("li");
                    elem.innerHTML = "processing " + filename;
                    elem.setAttribute("id", filename.replace(".","-"));
                    elem.setAttribute("class", "processing inprogress");
                    $("#blobs").get(0).appendChild(elem);

                    // Fire an AJAX call to retrieve the named entities in the
                    // document.
                    $.ajax({
                        url: '/service/NER',
                        data: {
                            text: text
                        },
                        dataType: 'text',
                        success: function(data){
                            console.log("success for " + filename);
                            $("#" + filename.replace(".","-")).removeClass("inprogress").addClass("done").get(0).innerHTML = filename + " processed";

                            // Create an entry for the document itself.
                            NER.nodes[filename] = {
                                node: filename,
                        type: "DOCUMENT",
                        count: 1,
                        index: NER.counter++
                            };
                            var doc_index = NER.counter - 1;

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
                                    NER.nodes[key] = {
                                        node: e[1],
                                type: e[0],
                                count: 1,
                                index: NER.counter++
                                    }
                                }
                                else{
                                    NER.nodes[key].count++;
                                }
                                var entity_index = NER.nodes[key].index;

                                // Enter a link into the link list, or just
                                // increase the count if the link exists
                                // already.
                                var link = "(" + entity_index + "," + doc_index + ")";
                                if(!NER.links.hasOwnProperty(link)){
                                    NER.links[link] = {
                                        source: entity_index,
                                        target: doc_index,
                                        count: 1
                                    };
                                }
                                else{
                                    NER.links[link].count++;
                                }
                            });

                            //console.log(NER.nodes);

                            // Increment the number of successfully processed
                            // files; if the number reaches the number of total
                            // files to process, launch the final step of
                            // assembling the graph.
                            ++NER.files_processed;
                            console.log(NER.files_processed + " of " + NER.num_files + " processed");

                            if(NER.files_processed == NER.num_files){
                                console.log("calling assembleGraph()");
                                var graph = assembleGraph();
                                renderGraph(graph);
                            }
                        },
                        error: function(){
                            console.log("error for " + filename);
                            $("#" + filename.replace(".","-")).removeClass("inprogress").addClass("failed").get(0).innerHTML = filename + " processed";
                        }
                    });
                }
            })(f);

            reader.readAsText(f);
        }
    }
    document.getElementById('file-info').innerHTML = '<ul>' + output.join('') + '</ul>';
}

window.onload = function(){
    document.getElementById('docs').addEventListener('change', handleFileSelect, false);
}
