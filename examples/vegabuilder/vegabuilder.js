/*jslint browser: true */

/*globals $, d3, vg, console */

$(function () {
	"use strict";

    tangelo.requireCompatibleVersion("0.2");

	function arrayEditor(spec) {
		var that,
			arr,
			main,
			controls,
			addButton,
			removeButton,
			elements;

		spec = spec || {};
		arr = [];

		main = d3.select(spec.parent).append("div").style("background-color", "rgba(150,150,150,0.1)").attr("class", "row-fluid");
		elements = main.append("div");
		controls = main.append("div").attr("class", "btn-group");
		addButton = controls.append("button")
			.attr("class", "btn")
			.text("Add")
			.on("click", function () {
				arr.push(spec.element.editor(spec.element));
			});
		removeButton = controls.append("button")
			.attr("class", "btn")
			.text("Remove")
			.on("click", function () {
				var element = arr.pop();
				element.remove();
			});
		spec.element.parent = elements.node();
		that = {};

		that.value = function (v) {
			var i, val = [], e;
			if (v === undefined) {
				for (i = 0; i < arr.length; i += 1) {
					val.push(arr[i].value());
				}
				return val;
			} else {
				for (i = 0; i < v.length; i += 1) {
					e = spec.element.editor(spec.element);
					arr.push(e);
					e.value(v[i]);
				}
			}
		};

		return that;
	}

	function objectEditor(spec) {
		var that,
			fields,
			obj,
			main,
			fieldDiv,
			fieldPre,
			fieldCheck,
			fieldContent,
			isContainer,
			d;

		spec = spec || {};
		fields = spec.fields || {};
		obj = {};

		main = d3.select(spec.parent).append("div").style("background-color", "rgba(150,150,150,0.1)").attr("class", "row-fluid").append("div").attr("class", "span12");

		function changeActive() {
			var check = d3.select(this),
				name = check.attr("data-field");
			obj[name].active = check.property("checked");
			if (check.property("checked")) {
				$(obj[name].parent).show("fast");
			} else {
				$(obj[name].parent).hide("fast");
			}
		}

		for (d in fields) {
			if (fields.hasOwnProperty(d)) {
				isContainer = fields[d].editor === objectEditor || fields[d].editor === arrayEditor;
				fieldDiv = main.append("div").attr("class", "row-fluid").append("div").attr("class", "span12");
				if (isContainer) {
					fieldPre = fieldDiv.append("div").attr("class", "span11 offset1");
				} else {
					fieldPre = fieldDiv.append("span").attr("class", "span2 offset1");
				}
				fieldCheck = fieldPre.append("input").attr("type", "checkbox").attr("data-field", d).on("click", changeActive);
				fieldPre.append("span").text(" " + d);

				if (isContainer) {
					fieldContent = fieldDiv.append("div").attr("class", "row-fluid").append("div").attr("class", "span11 offset1");
				} else {
					fieldContent = fieldDiv.append("span");
				}
				fields[d].parent = fieldContent.node();
				obj[d] = fields[d].editor(fields[d]);
				obj[d].check = fieldCheck;
				obj[d].active = false;
				obj[d].parent = fields[d].parent;
				$(obj[d].parent).hide();
			}
		}

		that = {};

		that.value = function (v) {
			var d, val = {};

			if (v === undefined) {
				for (d in obj) {
					if (obj.hasOwnProperty(d)) {
						if (obj[d].active) {
							val[d] = obj[d].value();
						}
					}
				}
				return val;
			}

			for (d in obj) {
				if (obj.hasOwnProperty(d)) {
					obj[d].active = false;
					obj[d].check.property("checked", false);
					$(obj[d].parent).hide("fast");
				}
			}
			for (d in v) {
				if (v.hasOwnProperty(d)) {
					if (obj.hasOwnProperty(d)) {
						obj[d].value(v[d]);
						obj[d].active = true;
						obj[d].check.property("checked", true);
						$(obj[d].parent).show("fast");
					} else {
						console.log("warning: unknown property encountered: " + d);
					}
				}
			}
		};

		that.remove = function () {
			main.remove();
		};

		return that;
	}

	function numberEditor(spec) {
		var that,
			value,
			input;

		spec = spec || {};
		value = spec.value || 0;

		input = d3.select(spec.parent).append("input").attr("type", "text").attr("value", value);

		that = {};

		that.value = function (v) {
			if (v === undefined) {
				return +input.property("value");
			}
			input.property("value", v);
		};

		return that;
	}

	function stringEditor(spec) {
		var that,
			value,
			input;

		spec = spec || {};
		value = spec.value || "";

		input = d3.select(spec.parent).append("input").attr("type", "text").attr("value", value);

		that = {};

		that.value = function (v) {
			if (v === undefined) {
				return input.property("value");
			}
			input.property("value", v);
		};

		return that;
	}

	function booleanEditor(spec) {
		var that,
			value,
			input;

		spec = spec || {};
		value = spec.value || false;

		input = d3.select(spec.parent).append("input").attr("type", "checkbox").property("checked", value);

		that = {};

		that.value = function (v) {
			if (v === undefined) {
				return input.property("checked");
			}
			input.property("checked", v);
		};

		return that;
	}

	function rangeEditor(spec) {
		var that,
			value,
			input,
			select;

		spec = spec || {};
		value = spec.value || "";

		select = d3.select(spec.parent).append("select");
		select.selectAll("option")
			.data(["width", "height", "symbol", "category10", "category20", "custom"])
			.enter().append("option")
			.text(function (d) { return d; });
		input = d3.select(spec.parent).append("input").attr("type", "text").attr("value", value);

		that = {};

		that.value = function (v) {
			var values;

			if (v === undefined) {
				if (select.property("value") === "custom") {
					values = input.property("value").split(",");
					if (values.length > 0 && isNaN(values[0])) {
						return values;
					}
					return values.map(function (d) { return +d; });
				}
				return select.property("value");
			}
			if (v instanceof Array) {
				input.property("value", v.join(","));
				select.property("value", "custom");
			} else {
				input.property("value", "");
				select.property("value", v);
			}
		};

		return that;
	}

	function listEditor(spec) {
		var that,
			value,
			input;

		spec = spec || {};
		value = spec.value || "";

		input = d3.select(spec.parent).append("input").attr("type", "text").attr("value", value);

		that = {};

		that.value = function (v) {
			var values;

			if (v === undefined) {
				values = input.property("value").split(",");
				return values.map(function (d) { return +d; });
			}
			input.property("value", v.join(","));
		};

		return that;
	}

	function selectEditor(spec) {
		var that,
			value,
			select;

		spec = spec || {};
		value = spec.value || "";

		select = d3.select(spec.parent).append("select");
		select.selectAll("option")
			.data(spec.options)
			.enter().append("option")
			.text(function (d) { return d; });
		select.property("value", value);

		that = {};

		that.value = function (v) {
			var values;

			if (v === undefined) {
				return select.property("value");
			}
			select.property("value", v);
		};

		return that;
	}

	var valueFields,
		propertyFields,
		editor;

	valueFields = {
		scale: {editor: stringEditor, value: "x"},
		field: {editor: stringEditor, value: "data"},
		band: {editor: booleanEditor, value: 0},
		offset: {editor: numberEditor, value: 0},
		value: {editor: stringEditor, value: 0}
	};

	propertyFields = {
		x: {editor: objectEditor, fields: valueFields},
		y: {editor: objectEditor, fields: valueFields},
		width: {editor: objectEditor, fields: valueFields},
		height: {editor: objectEditor, fields: valueFields},
		x2: {editor: objectEditor, fields: valueFields},
		y2: {editor: objectEditor, fields: valueFields},
		fill: {editor: objectEditor, fields: valueFields},
		stroke: {editor: objectEditor, fields: valueFields},
		startAngle: {editor: objectEditor, fields: valueFields},
		endAngle: {editor: objectEditor, fields: valueFields},
		innerRadius: {editor: objectEditor, fields: valueFields},
		outerRadius: {editor: objectEditor, fields: valueFields}
	};

	editor = objectEditor({
		parent: "#editor",
		fields: {
			name: {editor: stringEditor, value: "visualization"},
			width: {editor: numberEditor, value: 400},
			height: {editor: numberEditor, value: 400},
			padding: {editor: objectEditor, fields: {
				bottom: {editor: numberEditor, value: 50},
				top: {editor: numberEditor, value: 50},
				left: {editor: numberEditor, value: 50},
				right: {editor: numberEditor, value: 50}
			}},
			data: {editor: arrayEditor, element: {
				editor: objectEditor,
				fields: {
					name: {editor: stringEditor, value: "table"},
					values: {editor: listEditor, value: "1,2,3"},
					url: {editor: stringEditor, value: "../vegalab/data/letters.json"},
					transform: {editor: arrayEditor, element: {
						editor: objectEditor,
						fields: {
							type: {
								editor: selectEditor,
								options: ["array", "copy", "facet", "filter", "flatten", "sort", "stats", "unique", "zip", "force", "geo", "geopath", "pie", "stack", "treemap", "wordcloud"],
								value: "arc"
							},
							value: {editor: stringEditor, value: "data"},
							by: {editor: stringEditor, value: "data"}
						}
					}}
				}
			}},
			scales: {editor: arrayEditor, element: {
				editor: objectEditor,
				fields: {
					name: {editor: stringEditor, value: "x"},
					type: {
						editor: selectEditor,
						options: ["ordinal", "time", "utc", "linear", "log", "pow", "sqrt", "quantile", "quantize", "threshold"],
						value: "ordinal"
					},
					nice: {editor: booleanEditor, value: false},
					domain: {editor: objectEditor, fields: {
						data: {editor: stringEditor, value: "table"},
						field: {editor: stringEditor, value: "data"}
					}},
					range: {editor: rangeEditor, value: "width"}
				}
			}},
			axes: {editor: arrayEditor, element: {
				editor: objectEditor,
				fields: {
					type: {editor: stringEditor, value: "x"},
					scale: {editor: stringEditor, value: "x"}
				}
			}},
			marks: {editor: arrayEditor, element: {
				editor: objectEditor,
				fields: {
					type: {
						editor: selectEditor,
						options: ["rect", "symbol", "path", "arc", "area", "line", "image", "text"],
						value: "rect"
					},
					from: {editor: objectEditor, fields: {
						data: {editor: stringEditor, value: "table"}
					}},
					properties: {editor: objectEditor, fields: {
						enter: {editor: objectEditor, fields: propertyFields},
						update: {editor: objectEditor, fields: propertyFields},
						hover: {editor: objectEditor, fields: propertyFields}
					}}
				}
			}}
		}
	});

	d3.json("arc.json", function (error, spec) {
		editor.value(spec);
	});

	window.setInterval(function () {
		var spec = editor.value();
		vg.parse.spec(spec, function (chart) { chart({el: "#vis"}).update(); });
	}, 1000);
});
