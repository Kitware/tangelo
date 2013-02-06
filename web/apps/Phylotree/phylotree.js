var phylotree = {}

phylotree.getMongoDBInfo = function () {
    "use strict";

    // Read in the config options regarding which MongoDB
    // server/database/collection to use.
    return {
        server: localStorage.getItem('phylotree:mongodb-server') || 'localhost',
        db: localStorage.getItem('phylotree:mongodb-db') || 'xdata',
        coll: localStorage.getItem('phylotree:mongodb-coll') || 'phylodata'
    };
};

var lMargin = 50, rMargin = 50, tMargin = 120, bMargin = 120,
	width = 1200 - lMargin - rMargin,
    height = 1000 - tMargin - bMargin,
	i = 0,
	root;

function elbow(d, i) {
	return "M" + d.source.y + "," + d.source.x + "V" + d.target.x + "H" + d.target.y;
}

// Toggle clades.
function toggle(d, node, callback) {
	calledAlready = false;
	if (d.clades) {
		d._clades = d.clades;
		d.clades = null;
		d.children = null;
	} else {
		if (typeof(d._clades[0]) === "string") {
			calledAlready = true;
			updateJSON(d, node, callback);
			//d.clades = d._clades;
		} else {
			d.clades = d._clades;
			d._clades = null;
		}
	}
	// execute callback function
	if (!calledAlready && callback && typeof(callback) === "function") {
		callback(d);
	}
}

function toggleAll(d, callback) {
	// counter for async control
    togCount++;
	if (d.clades) {
		d.clades.forEach(function(el) {toggleAll(el);});
		toggle(d);
	}
	togCount--;
	// if done and we have a callback function, execute it
	if (togCount === 0 && callback && typeof(callback) === "function") {
	    callback();
	}
}

function updateJSON(oldJSON, node, callback) {
	count = 0;
	togCount1 = 0;
	len = oldJSON._clades.length;

	// on loading the data change the circle color to gray
	d3.select(node.childNodes[0]).style("fill", "green");
	
	// make a json call for data for each one of the children.
	// SHOULD PROBABLY BE... just one call for for the current node but have
	// had some major problems getting that new JSON data to play nice with
	// d3.cluster()
	oldJSON._clades.forEach(function(el,index,arr) {
		d3.json('/service/phylomongo/' + mongo.server + '/' + mongo.db + '/' + mongo.coll + '?maxdepth=3&_id=' + el, function(json) {
		//d3.json("phpparse.php?oid=" + el, function(json) {
			oldJSON._clades[index] = json;
			// counter used to tell when all async calls have been complete
			count++;
			// if all calls have been completed
			if (count === len) {
				oldJSON._clades.forEach(function(item) {
					// counters for async control
                    togCount1++;
                    togCount = 0;
                    if (togCount1 == len) {
				        toggleAll(item, function() {
							oldJSON.clades = oldJSON._clades;
							oldJSON._clades = null;
							callback();
						});
				    } else {
				        toggleAll(item);
				    }
			    });
			}
		})
	});
}

var togCount = 0;	

var cluster = d3.layout.cluster()
	.size([height, width - 160])
	.children(function(d) {
		return (!d.clades || d.clades.length === 0) ? null : d.clades;
	});

var vis = d3.select("#tree").append("svg:svg")
    .attr("width", width + lMargin + rMargin)
    .attr("height", height + tMargin + bMargin)
    .append("svg:g")
    .attr("transform", "translate(" + lMargin + "," + rMargin + ")");

mongo = phylotree.getMongoDBInfo();

// 50c8ef4cf7db5011970002ae is the root noode of the heliconia tree.
// Can probably make this a better API
d3.json('/service/phylomongo/' + mongo.server + '/' + mongo.db + '/' + mongo.coll + '?maxdepth=' + '3', function(json) {
//d3.json("phpparse.php?oid=50c8ef4cf7db5011970002ae", function(json) {
	root = json;
	root.x0 = height / 2;
	root.y0 = 0;
	
	// initialize the display to show children nodes
	root.clades.forEach(toggleAll);
	update(root);
});

function update(source) {
	var duration = d3.event && d3.event.altKey ? 5000 : 500;
	
	// Compute the new tree layout
    //var nodes = tree.nodes(root);
	var nodes = cluster.nodes(root);
	
	// Normalize for each fixed-depth
	//nodes.forEach(function(d) {
	//	d.y = d.depth * 180;
	//});
	
	// Update the nodes...
	var node = vis.selectAll("g.node")
		.data(nodes, function(d) {
			return d.id || (d.id = ++i);
		});
		
	// Enter any new nodes at the parent's previous position.
	var nodeEnter = node.enter().append("svg:g")
		.attr("class", "node")
		.attr("transform", function(d) {
			return "translate(" + source.y0 + "," + source.x0 + ")"; })
		.on("click", function(d) {
			toggle(d, this, function() {
				update(d);
			});
		});
		
	nodeEnter.append("svg:circle")
		.attr("r", 1e-6)
		.style("fill", function(d) {
			return d._clades ? "lightsteelblue" : "#fff";
		});
		
	nodeEnter.append("svg:text")
		.attr("x", function(d) {
			return d.clades || d._clades ? - 10 : 10; })
		.attr("dy", ".35em")
		.attr("text-anchor", function(d) {
			return d.clades || d._clades ? "end" : "start"; })
		.text(function(d) {
			// truncate ID's to last 4 characters
			return d.taxonomies ? d.taxonomies[0].scientific_name : d._id.substring(d._id.length - 4); })
		.style("fill-opacity", 1e-6);
		
	// Transition nodes to their new position.
	var nodeUpdate = node.transition()
		.duration(duration)
		.attr("transform", function(d) {
			return "translate(" + d.y + "," + d.x + ")";
		});
		
	nodeUpdate.select("circle")
		.attr("r", 4.5)
		.style("fill", function(d) {
			return d._clades ? "lightsteelblue" : "#fff";
		});
		
	nodeUpdate.select("text")
		.style("fill-opacity", 1);
		
	// Transition existing nodes to their parent's new position.
	var nodeExit = node.exit().transition()
		.duration(duration)
		.attr("transform", function(d) { 
			return "translate(" + source.y + "," + source.x + ")"; })
      	.remove();
		
	nodeExit.select("circle")
		.attr("r", 1e-6);

	nodeExit.select("text")
		.style("fill-opacity", 1e-6);

	// Update the links…
	var link = vis.selectAll("path.link")
	//	.data(tree.links(nodes), function(d) { 
		.data(cluster.links(nodes), function(d) {
			return d.target.id;
		});

	// Enter any new links at the parent's previous position.
	link.enter().insert("svg:path", "g")
		.attr("class", "link")
		.attr("d", function(d) {
			var o = {x: source.x0, y: source.y0};
			return elbow({source: o, target: o});
		})
		.transition()
		.duration(duration)
		.attr("d", elbow);
		
	// Transition links to their new position.
	link.transition()
		.duration(duration)
		.attr("d", elbow);

	// Transition exiting nodes to the parent's new position.
	link.exit().transition()
		.duration(duration)
		.attr("d", function(d) {
			var o = {x: source.x, y: source.y};
			return elbow({source: o, target: o});
		})
		.remove();

	// Stash the old positions for transition.
	nodes.forEach(function(d) {
		d.x0 = d.x;
		d.y0 = d.y;
	});
}
