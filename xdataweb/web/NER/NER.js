
var graph = (function(){
    // Data making up the graph.
    var nodes = {};
    var links = {};

    // A counter to help uniquely identify incoming data from different sources.
    var counter = 0;

    // Configuration parameters for graph rendering.
    var config = {
        // Whether to make the radius of each node proportional to the number of
        // times it occurs in the corpus.
        nodeScale: false,

        // Whether to thicken a link proportionally to the number of times it
        // occurs in the corpus.
        linkScale: false 
    };

    var color = d3.scale.category20();

    var svg = d3.select("#graph");

    var width = svg.attr("width"),
        height = svg.attr("height");

    return {
        assemble: function(nodedata, linkdata){
            // Copy links over into private links array.
            $.each(linkdata, function(k,v){
                links.push(v);
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
            nodes = Array(Object.keys(nodedata).length);

            // Now plop each entity into its proper place.
            $.each(nodedata, function(k,v){
                var i = v.index;
                delete v.index;
                nodes[i] = v;
            });
        },

        render: function(){
            var force = d3.layout.force()
                .charge(-120)
                .linkDistance(30)
                .size([width, height])
                .nodes(nodes)
                .links(links)
                .start();

            var link = svg.selectAll("line.link")
                .data(links)
                .enter().append("line")
                .classed("link", true)
                .style("stroke-width", linkScalingFunction());

            var node = svg.selectAll("circle.node")
                .data(nodes)
                .enter().append("circle")
                .classed("node", true)
                .attr("r", nodeScalingFunction())
                .style("fill", function(d) { return color(d.type); })
                .call(force.drag);

            node.append("title")
                .text(function(d) { return d.name; });

            force.on("tick", function(){
                link.attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });

                node.attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; });
            });
        },

        updateConfig: function(){
            // Sweep through the configuration elements and set the boolean
            // flags appropriately.
            var check = $("#nodefreq")[0];
            config.nodeScale = check.checked;

            check = $("#linkfreq")[0];
            config.linkScale = check.checked;        
        },

        nodeScalingFunction: function(){
            if(config.nodeScale){
                return function(d) { return 5*Math.sqrt(d.count); };
            }
            else{
                return 5;
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



///Top-level container object for this js file.
var NER = {};

// "nodes" is a table of entity names, mapping to an array position generated
// uniquely by the "counter" variable.  Once the table is complete, the nodes
// table can be recast into an array.
NER.nodes = {};
NER.links = {};
NER.counter = 0;

// This count will signal when the last ajax request has completed, and graph
// assembly can continue.
NER.num_files = 0;
NER.files_processed = 0;

// This table stores formatted filename information that can be dynamically
// added to in different situations ("processing" to "processed", etc.).
NER.filenames = {};

/*function assembleGraph(){*/
    //// Create a graph object.
    //var g = {};

    //// Copy the links over into an array within the graph object.
    //g.links = [];
    //$.each(NER.links, function(k, v){
        //g.links.push(v);
    //});

    //// Do the same for the nodes, but do two additional things:
    ////
    //// 1. When extracting an object from the NER.nodes table, remove the "index"
    ////    property, as it will no longer be needed after final placement of the
    ////    node.
    ////
    //// 2. Place the node object into the place in the array indexed by that
    ////    "index" property.  This ensures that the references in the link list
    ////    are to the proper nodes.
    ////
    //// Start by creating an empty array of length equal to the number of total
    //// entities.
    //g.nodes = Array(Object.keys(NER.nodes).length);

    //// Now plop each entity into its proper place.
    //$.each(NER.nodes, function(k, v){
        //var i = v.index;
        //delete v.index;
        //g.nodes[i] = v;
    //});

    //return g;
//}

//function renderGraph(g){
    //var color = d3.scale.category20();

    //var svg = d3.select("#graph");

    //var width = svg.attr("width"),
        //height = svg.attr("height");

    //var force = d3.layout.force()
        //.charge(-120)
        //.linkDistance(30)
        //.size([width, height])
        //.nodes(g.nodes)
        //.links(g.links)
        //.start();

    //var link = svg.selectAll("line.link")
        //.data(g.links)
        //.enter().append("line")
        //.attr("class", "link")
        //.style("stroke-width", function(d) { return Math.sqrt(d.count); });

    //var node = svg.selectAll("circle.node")
        //.data(g.nodes)
        //.enter().append("circle")
        //.attr("class", "node")
        //.attr("r", function(d) { return 5*Math.sqrt(d.count); })
        //.style("fill", function(d) { return color(d.type); })
        //.call(force.drag);

    //node.append("title")
        //.text(function(d) { return d.name; });

    //force.on("tick", function(){
        //link.attr("x1", function(d) { return d.source.x; })
        //.attr("y1", function(d) { return d.source.y; })
        //.attr("x2", function(d) { return d.target.x; })
        //.attr("y2", function(d) { return d.target.y; });

    //node.attr("cx", function(d) { return d.x; })
        //.attr("cy", function(d) { return d.y; });
    //});
//}

function processFile(filename, id){
return function(e){
    //var filename = escape(file.name);
    console.log(filename);

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
    console.log("Checking hash for " + filename + "...");

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
                console.log("hash for " + filename + " not found in DB, recomputing");
                $.ajax({
                    type: 'POST',
                    url: '/service/NER',
                    data: {
                        text: text
                    },
                    dataType: 'text',
                    success: processFileContents(filename, id, file_hash),
                    error: function(){
                        console.log("error for " + filename);
                        $("#" + filename.replace(".","-")).removeClass("inprogress").addClass("failed").get(0).innerHTML = filename + " processed";
                    }
                });
            }
            else{
                console.log("hash for " + filename + " found in DB!");
                // The data returned from the DB is in MongoDB
                // format.  Read it into a JSON object, then
                // extract the payload.
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
    console.log("success for " + filename);
    //$("#" + filename.replace(".","-")).removeClass("inprogress").addClass("done").get(0).innerHTML = filename + " processed";

    console.log("id = #" + id);
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
                name: e[1],
                type: e[0],
                count: 1,
                index: NER.counter++
            };
        }
        else{
            NER.nodes[key].count++;
        }
        var entity_index = NER.nodes[key].index;

        // Enter a link into the link list, or just increase the count if
        // the link exists already.
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
/*        var graph = assembleGraph();*/
        /*renderGraph(graph);*/

        graph.assemble();
        graph.render();
    }
};
}

function handleFileSelect(evt){
    console.log("hello?");
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
    console.log("hello");
    document.getElementById('docs').addEventListener('change', handleFileSelect, false);
};
