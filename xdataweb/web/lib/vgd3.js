(function(){
vg = {version:"0.0.1"};
// Logging and Error Handling

vg.log = function(msg) {
  if (console && console.log) console.log(msg);
};

vg.error = function(msg) {
  throw new Error(msg);
};

// Type Utilities

var toString = Object.prototype.toString;
var vg_ref_char = "@";
var vg_ref_regex = /\[|\]|\./;

vg.isObject = function(obj) {
  return obj === Object(obj);
};

vg.isFunction = function(obj) {
  return toString.call(obj) == '[object Function]';
};

vg.isString = function(obj) {
  return toString.call(obj) == '[object String]';
};
  
vg.isArray = Array.isArray || function(obj) {
  return toString.call(obj) == '[object Array]';
};

// Object and String Utilities

vg.extend = function(obj) {
  for (var i=1, len=arguments.length; i<len; ++i) {
    var source = arguments[i];
    for (var prop in source) obj[prop] = source[prop];
  }
  return obj;  
};

vg.clone = function(obj) {
  if (!vg.isObject(obj)) return obj;
  return vg.isArray(obj) ? obj.slice() : vg.extend({}, obj);
};

vg.repeat = function(str, n) {
  for (var s="", i=0; i<n; ++i) s += str;
  return s;
};

vg.str = function(str) {
  return vg.isArray(str) ? "[" + str.map(vg.str) + "]"
       : vg.isString(str) ? ("'"+str+"'") : str;
};

// Value and Data Reference Handling

vg.value = function(enc) {
  if (!vg.isObject(enc)) { return vg.str(enc); }
  var val = enc.value  !== undefined ? enc.value  : 1;
  var off = enc.offset !== undefined ? enc.offset : null;
  var s = "";
  if (enc.scale !== undefined) {
    var scale = "scales['"+enc.scale+"']";
    // if has scale, generate scale function
    if (enc.value === undefined && enc.field === undefined) {
      s = scale+".rangeBand ? "+scale+".rangeBand()"
        + (off != null ? " + "+off : "") + " : ";
    }
    var d = enc.field !== undefined ? "d['"+enc.field+"']" : val;
    s += scale+"("+d+")"+ (off !== null ? " + "+off : "");
  } else if (enc.field !== undefined) {
    s = "d['"+enc.field+"']" + (off !== null ? " + "+off : "");
  } else {
    // if has value, set directly
    s = vg.str(off!==null ? (val+off) : val);
  }
  return s;  
};

vg.varname = function(typestr, index) {
  return typestr + "_" + index;
};

vg.get = function(field) {
  return "function(d,i) { return "+vg.value(field)+"; }";
};vg.code = function() {
  var x = {},
      src = [],
      chain = [],
      indent = "",
      step = false,
      cache = true,
      debug = true;

  function check_step() {
    if (step) {
      x.indent();
      step = false;
    }
  }
  
  x.source = function() {
    return src.join("");
  };

  x.chain = function() {
    chain.push(src.length);
    step = true;
    return x;
  };
  
  x.unchain = function(parens, nosemi) {
    parens = vg.repeat(")", parens || 0);
    var len = src.length;
    if (len && chain.length && chain[chain.length-1] >= 0) {
      src[len-1] = src[len-1].slice(0,-1) + parens + (nosemi?"":";") + "\n";
    }
    chain.pop();
    check_step();
    return x.unindent();
  };
  
  x.decl = function(name, expr) {
    src.push(indent+"var "+name+" = "+expr
      + (chain.length ? "" : ";") + "\n");
    check_step();
    return x;
  };

  x.setv = function(obj, name, expr) {
    if (arguments.length == 2) {
      expr = name;
      name = obj;
      src.push(indent+name+" = "+expr+";\n");
    } else {
      src.push(indent+obj+"['"+name+"'] = "+expr+";\n");      
    }
    check_step();
    return x;
  };
  
  x.push = function(expr) {
    expr = expr || "";
    src.push(!expr ? "\n" : indent+expr+"\n");
    check_step();
    return x;
  };

  x.call = function(expr) {
    var args = Array.prototype.slice.call(arguments, 1)
      .map(function(x) { return vg.isArray(x) ? "["+x+"]" : x; });
    src.push(indent + expr + "(" + args.join(", ") + ")"
      + (chain.length ? "" : ";") + "\n");
    check_step();
    return x;
  };

  x.attr = function(obj, name, value) {
    if (arguments.length == 2) {
      value = name;
      name = obj;
      obj = "sel";
    }
    src.push(indent +
      obj + ".attr('" + name + "', " + value + ");\n");
    check_step();
    return x;
  };

  x.indent = function(count) {
    count = count || 1;
    while (--count >= 0) indent += "  ";
    return x;
  };
  
  x.unindent = function(count) {
    count = count || 1;
    indent = indent.slice(0, indent.length-(2*count));
    return x;
  };
  
  x.append = function(s) {
    src.push(s);
    return x;
  };
  
  x.tab = function() {
    return indent;
  };
  
  x.compile = function() {
    var src = "return " + x.source() + ";",
        f = vg_code_cache[src];
    if (f === undefined) {
      if (debug) vg.log(src);
      f = (new Function(src))();
    }
    if (cache) vg_code_cache[src] = f;
    return f;
  };
  
  x.clear = function() {
    src = [];
    chain = [];
    step = false;
    indent = "";
    return x;
  };
  
  return x;
}

var vg_code_cache = {};
vg.template = function(source) {
  var x = {
    source: source,
    text: source
  };

  function stringify(str) {
    return str==undefined ? ""
      : vg.isString(str) ? str : JSON.stringify(str);
  }

  x.set = function(name, content) {
    var regexp = new RegExp("\{\{"+name+"\}\}", "g");
    content = stringify(content);
    x.text = x.text.replace(regexp, content);
  };

  x.toString = function() {
    return x.text;
  };

  return x;
};
vg.scales = function(spec, sc) {
  (spec.scales || []).forEach(function(scale, index) {
    if (index > 0) sc.push();
    vg.scale(scale, sc);
  });
};

vg.scale = function(scale, sc) {
  // determine scale type
  var type = scale.type || "linear";
  sc.chain().push("scales['"+scale.name+"'] = d3.scale."+type+"()");
  (type==="ordinal" ? vg.scale.ordinal : vg.scale.quant)(scale, sc);
  sc.unchain();
};

vg.scale.keywords = {
  "width": "width",
  "height": "height"
};

vg.scale.ordinal = function(scale, sc) {
  // init domain
  var domain = scale.domain;
  if (vg.isArray(domain)) {
    sc.call(".domain", vg.print(domain));
  } else if (vg.isObject(domain)) {
    var ref = domain,
        dat = "data['"+ref.data+"']",
        get = vg.str(ref.field);
    sc.call(".domain", "_.unique(_.pluck("+dat+", "+get+"))");
  }

  // init range
  var range = vg.scale.range(scale),
      isStr = vg.isString(range[0]);
  if (scale.reverse) range = range.reverse();
  range = "[" + range.map(function(r) {
    return vg.scale.keywords[r] ? r : vg.str(r);
  }).join(", ") + "]";
  if (isStr) { // e.g., color or shape values
    sc.call(".range", range); 
  } else { // spatial values
    sc.call(scale.round ? ".rangeRoundBands" : ".rangeBands",
      range, scale.padding);
  }
};

vg.scale.quant = function(scale, sc) {
  // init domain
  var dom = [null, null];
  if (scale.domain !== undefined) {
    if (vg.isObject(scale.domain)) {
      var ref = scale.domain,
          dat = "data['"+ref.data+"']",
          get = vg.get({field:ref.field});
      dom[0] = "d3.min("+dat+", "+get+")";
      dom[1] = "d3.max("+dat+", "+get+")";
    } else {
      dom = scale.domain;
    }
  }
  if (scale.domainMin !== undefined) {
    if (vg.isObject(scale.domainMin)) {
      var ref = scale.domainMin,
          dat = "data['"+ref.data+"']",
          get = vg.get({field:ref.field});
      dom[0] = "d3.min("+dat+", "+get+")";
    } else {
      dom[0] = scale.domainMin;
    }
  }
  if (scale.domainMax !== undefined) {
    if (vg.isObject(scale.domainMax)) {
      var ref = scale.domainMax,
          dat = "data['"+ref.data+"']",
          get = vg.get({field:ref.field});
      dom[1] = "d3.max("+dat+", "+get+")";
    } else {
      dom[1] = scale.domainMax;
    }
  }
  if (scale.zero === undefined || scale.zero) { // default true
    dom[0] = "Math.min(0, "+dom[0]+")";
    dom[1] = "Math.max(0, "+dom[1]+")";
  }
  sc.call(".domain", "["+dom.join(", ")+"]");

  // init range
  var range = vg.scale.range(scale);
  // vertical scales should flip by default, so use XOR here
  if ((!!scale.reverse) != ("height"==scale.range)) range = range.reverse();
  range = "[" + range.map(function(r) {
    return vg.scale.keywords[r] ? r : vg.str(r);
  }).join(", ") + "]";
  sc.call(scale.round ? ".rangeRound" : ".range", range);
  
  if (scale.clamp)
    sc.call(".clamp", "true");
  if (scale.nice)
    sc.call(".nice");
  if (scale.type==="pow" && scale.exponent)
    sc.call(".exponent", scale.exponent);  
};


vg.scale.range = function(scale) {
  var rng = [null, null];
  
  if (scale.range !== undefined) {
    if (vg.isString(scale.range)) {
      if (vg.scale.keywords[scale.range]) {
        rng = [0, scale.range]
      } else {
        vg.error("Unrecogized range: "+scale.range);
        return rng;
      }
    } else if (vg.isArray(scale.range)) {
      rng = scale.range;
    } else {
      rng = [0, scale.range];
    }
  }
  if (scale.rangeMin !== undefined) {
    rng[0] = scale.rangeMin;
  }
  if (scale.rangeMax !== undefined) {
    rng[1] = scale.rangeMax;
  }
  return rng;
};vg.axes = function(spec, sc) {
  (spec.axes || []).forEach(function(axis, index) {
    if (index > 0) sc.push();
    vg.axis(axis, index, sc);
  });
};

vg.axis = function(axis, index, sc) {
  var aname = vg.varname("axis", index);
  sc.chain()
    .decl(aname, "d3.svg.axis()");
  
  // axis scale
  if (axis.scale !== undefined) {
    sc.call(".scale", "scales['"+axis.scale+"']");
  }

  // axis orientation
  var orient = axis.orient || vg_axis_orient[axis.axis];
  sc.call(".orient", vg.str(orient));

  // axis values
  if (axis.values !== undefined) {
    sc.call(".tickValues", axis.values);
  }

  // axis label formatting
  if (axis.format !== undefined) {
    sc.call(".tickFormat", "d3.format('"+axis.format+"')");
  }

  // axis tick subdivision
  if (axis.subdivide !== undefined) {
    sc.call(".tickSubdivide", axis.subdivide);
  }
  
  // axis tick padding
  if (axis.tickPadding !== undefined) {
    sc.call(".tickPadding", axis.tickPadding);
  }
  
  // axis tick size(s)
  var size = [];
  if (axis.tickSize !== undefined) {
    for (var i=0; i<3; ++i) size.push(axis.tickSize);
  } else {
    size = [6, 6, 6];
  }
  if (axis.tickSizeMajor !== undefined) size[0] = axis.tickSizeMajor;
  if (axis.tickSizeMinor !== undefined) size[1] = axis.tickSizeMinor;
  if (axis.tickSizeEnd   !== undefined) size[2] = axis.tickSizeEnd;
  if (size.length) {
    sc.call(".tickSize", size.join(","));
  }
  
  // tick arguments
  if (axis.ticks !== undefined) {
    var ticks = vg.isArray(axis.ticks) ? axis.ticks : [axis.ticks];
    sc.call(".ticks", ticks.join(", "));
  }
  sc.unchain();

  // axis offset
  if (axis.offset) {
    sc.push(aname + ".offset = " + axis.offset + ";");
  }
  
  // cache scale name
  sc.push(aname + ".scaleName = '" + axis.scale + "';");

  sc.push("axes.push("+aname+");");
};

vg.axes.update = function(spec, sc) {
  if (!spec.axes || spec.axes.length==0) return;
  sc.decl("sel", "duration ? dom.transition(duration) : dom")
    .chain()
    .push("sel.selectAll('g.axis')")
    .push(".attr('transform', function(axis,i) {")
    .indent()
      .push("var offset = axis.offset || 0, xy;")
      .push("switch(axis.orient()) {")
      .indent()
        .push("case 'left':   xy = [     -offset,  0]; break;")
        .push("case 'right':  xy = [width+offset,  0]; break;")
        .push("case 'bottom': xy = [0, height+offset]; break;")
        .push("case 'top':    xy = [0,       -offset]; break;")
        .push("default: xy = [0,0];")
      .unindent()
      .push("}")
      .push("return 'translate('+xy[0]+', '+xy[1]+')';")
    .unindent()
    .push("})")
    .push(".each(function(axis) {")
      .indent()
      .push("axis.scale(scales[axis.scaleName]);")
      .push("var s = d3.select(this);")
      .push("(duration ? s.transition().duration(duration) : s).call(axis);")
      .unindent()
    .push("})")
    .unchain();
};

var vg_axis_orient = {
  "x":      "bottom",
  "y":      "left",
  "top":    "top",
  "bottom": "bottom",
  "left":   "left",
  "right":  "right"
};vg.marks = function(spec, sc) {
  // build global name map of encoders
  var map = {};
  (spec.encoders || []).forEach(function(enc) {
    map[enc.name] = enc;
  });
  // generate code for marks
  (spec.marks || []).forEach(function(mark, index) {
    if (index > 0) sc.push();
    vg.mark(mark, index, map, sc);
  });
};

vg.mark = function(mark, index, encoderMap, sc) {
  // check if mark type is supported
  if (vg.mark[mark.type] == undefined) {
    vg.log("Skipping unsupported mark type: "+mark.type);
    return;
  }
  
  sc.push("// Mark "+index+" ("+mark.type+")");
  
  // set up encoders, as needed
  var encoders = [];
  (mark.encoders || []).forEach(function(enc, i) {
    var def = encoderMap[enc.name];
    encoders.push({
      def: def,
      spec: vg.extend(vg.clone(def), enc)
    });
  });
  
  // encode mark
  encoders.forEach(function(enc) {
    vg.encoder.start(enc.def, enc.spec, mark, index, sc);
  });
  vg.mark[mark.type](mark, index, encoders, sc);
  encoders.forEach(function(enc) {
    vg.encoder.finish(enc.def, enc.spec, mark, index, sc);
  });
};

vg.mark.obj = "this.vega";

vg.mark.styles = {
  "opacity":       "opacity",
  "fill":          "fill",
  "stroke":        "stroke",
  "fillOpacity":   "fill-opacity",
  "strokeOpacity": "stroke-opacity",
  "strokeWidth":   "stroke-width",
  "textAlign":     "text-anchor",
  "textBaseline":  "dominant-baseline",
  "font":          "font",
  "fontWeight":    "font-weight",
  "fontStyle":     "font-style"
};

vg.mark.spatials = {
  "x1":          "x",
  "x2":          "x",
  "y1":          "y",
  "y2":          "y",
  "width":       "width",
  "height":      "height",
  "path":        "path",
  "innerRadius": "innerRadius",
  "outerRadius": "outerRadius",
  "startAngle":  "startAngle",
  "endAngle":    "endAngle",
  "interpolate": "interpolate",
  "tension":     "tension"
};

vg.mark.encode = function(mark, index, encoders, sc) {
  var name = vg.varname("mark", index),
      props = mark.properties,
      obj = vg.mark.obj;
  
  sc.push(name+".each(function(d,i) {").indent()
    .push(obj + " = {x:0, y:0};");
  
  // encoder properties
  encoders.forEach(function(enc) {
    vg.encoder.encode(enc.def, enc.spec, mark, index, sc);
  });

  // arc properties
  ["innerRadius","outerRadius","startAngle","endAngle"].forEach(function(p) {
    if (props[p] === undefined) return;
    sc.push(obj+"."+p + " = " + vg.value(props[p]) + ";");    
  });

  // horizontal spatial properties
  if (props.x1 !== undefined && props.x2 !== undefined) {
    sc.decl("x1", vg.value(props.x1))
      .decl("x2", vg.value(props.x2))
      .push("if (x1 > x2) { var tmp = x1; x1 = x2; x2 = tmp; }")
      .push(obj + ".x = x1;")
      .push(obj + ".width = (x2-x1);");
  } else if (props.x1 !== undefined && props.width !== undefined) {
    sc.decl("x1", vg.value(props.x1))
      .decl("width", vg.value(props.width))
      .push("if (width < 0) { x1 += width; width *= -1; }")
      .push(obj + ".x = x1;")
      .push(obj + ".width = width;");
  } else if (props.x2 !== undefined && props.width !== undefined) {
    sc.decl("width", vg.value(props.width))
      .decl("x2", vg.value(props.x2) + " - width")
      .push("if (width < 0) { x2 += width; width *= -1; }")
      .push(obj + ".x = x2;")
      .push(obj + ".width = width;");
  } else if (props.x1 !== undefined) {
    sc.push(obj + ".x = " + vg.value(props.x1) + ";");
  }

  // vertical spatial properties
  if (props.y1 !== undefined && props.y2 !== undefined) {
    sc.decl("y1", vg.value(props.y1))
      .decl("y2", vg.value(props.y2))
      .push("if (y1 > y2) { var tmp = y1; y1 = y2; y2 = tmp; }")
      .push(obj + ".y = y1;")
      .push(obj + ".height = (y2-y1);");
  } else if (props.y1 !== undefined && props.height !== undefined) {
    sc.decl("y1", vg.value(props.y1))
      .decl("height", vg.value(props.height))
      .push("if (height < 0) { y1 += height; height *= -1; }")
      .push(obj + ".x = y1;")
      .push(obj + ".height = height;");
  } else if (props.y2 !== undefined && props.height !== undefined) {
    sc.decl("height", vg.value(props.height))
      .decl("y2", vg.value(props.y2) + " - height")
      .push("if (height < 0) { y2 += height; height *= -1; }")
      .push(obj + ".y = y2;")
      .push(obj + ".height = height;");
  } else if (props.y1 !== undefined) {
    sc.push(obj + ".y = " + vg.value(props.y1) + ";");
  }

  sc.unindent().push("});");
};

vg.mark.rect = function(mark, index, encoders, sc) {
  var mname = vg.varname("mark", index),
      method = ".attr";
  
  // select
  sc.chain()
    .decl(mname, "dom.select('.mark-"+index+"')")
    .call(".selectAll", "'rect'")
    .call(".data", "data['"+mark.from+"']")
    .unchain();
    
  // exit and enter
  sc.push(mname+".exit().remove();");
  sc.push(mname+".enter().append('rect');");
  
  // compute spatial and encoder properties
  vg.mark.encode(mark, index, encoders, sc);

  // update and transition
  sc.chain().push("(duration"
    + " ? " + mname + ".transition().duration(duration)"
    + " : " + mname + ")");

  // encode spatial properties
  ["'x'","'y'","'width'","'height'"].forEach(function(name) {
    sc.call(method, name, "function() { return "+vg.mark.obj+"["+name+"]; }");
  });

  // encode all other properties
  for (var name in mark.properties) {
    if (vg.mark.spatials[name]) continue;
    var props = mark.properties[name],
        val = vg.value(props);
    if (props.field !== undefined) {
      val = "function(d,i) { return " + val + "; }";
    }
    sc.call(vg.mark.styles[name] ? ".style" : ".attr",
      vg.str(vg.mark.styles[name]||name), val);
  }
  sc.unchain();
};

vg.mark.path = function(mark, index, encoders, sc) {
  var mname = vg.varname("mark", index),
      method = ".attr";
  
  // select
  sc.chain()
    .decl(mname, "dom.select('.mark-"+index+"')")
    .call(".selectAll", "'path'")
    .call(".data", "data['"+mark.from+"']")
    .unchain();
    
  // exit and enter
  sc.push(mname+".exit().remove();");
  sc.push(mname+".enter().append('path');");

  // compute spatial and encoder properties
  vg.mark.encode(mark, index, encoders, sc);

  // update and transition
  sc.chain().push("(duration"
    + " ? " + mname + ".transition().duration(duration)"
    + " : " + mname + ")");

  // encode spatial properties
  sc.call(method, "'transform'", "function() { "
      + "return 'translate('+"+vg.mark.obj+".x+','+"+vg.mark.obj+".y+')'; }")
    .call(method, "'d'", "function() { return "+vg.mark.obj+".path; }");

  // encode all other properties
  for (var name in mark.properties) {
    if (vg.mark.spatials[name]) continue;
    var props = mark.properties[name],
        val = vg.value(props);
    if (props.field !== undefined) {
      val = "function(d,i) { return " + val + "; }";
    }
    sc.call(vg.mark.styles[name] ? ".style" : ".attr",
      vg.str(vg.mark.styles[name]||name), val);
  }
  sc.unchain();
};

vg.mark.arc = function(mark, index, encoders, sc) {
  var mname = vg.varname("mark", index),
      arc = "arc"+index,
      method = ".attr";
  
  // arc path generation
  sc.decl(arc, "d3.svg.arc()");
  
  // select
  sc.chain()
    .decl(mname, "dom.select('.mark-"+index+"')")
    .call(".selectAll", "'path'")
    .call(".data", "data['"+mark.from+"']")
    .unchain();
    
  // exit and enter
  sc.push(mname+".exit().remove();");
  sc.push(mname+".enter().append('path');");

  // compute spatial and encoder properties
  vg.mark.encode(mark, index, encoders, sc);

  // update and transition
  sc.chain().push("(duration"
    + " ? " + mname + ".transition().duration(duration)"
    + " : " + mname + ")");

  // encode spatial properties
  sc.call(method, "'transform'", "function() { "
      + "return 'translate('+"+vg.mark.obj+".x+','+"+vg.mark.obj+".y+')'; }")
    .call(method, "'d'", "function() { return "+arc+"("+vg.mark.obj+"); }");

  // encode all other properties
  for (var name in mark.properties) {
    if (vg.mark.spatials[name]) continue;
    var props = mark.properties[name],
        val = vg.value(props);
    if (props.field !== undefined) {
      val = "function(d,i) { return " + val + "; }";
    }
    sc.call(vg.mark.styles[name] ? ".style" : ".attr",
      vg.str(vg.mark.styles[name]||name), val);
  }
  sc.unchain();
};

vg.mark.area = function(mark, index, encoders, sc) {
  var mname = vg.varname("mark", index),
      area = "area"+index,
      props = mark.properties;
    
  // select
  sc.chain()
    .decl(mname, "dom.select('.mark-"+index+"')")
    .call(".selectAll", "'path'")
    .call(".data", "[data['"+mark.from+"']]")
    .unchain();
    
  // exit and enter
  sc.push(mname+".exit().remove();");
  sc.push(mname+".enter().append('path');");

  // update and transition
  sc.chain().push("(duration"
    + " ? " + mname + ".transition().duration(duration)"
    + " : " + mname + ")");

  // encode spatial properties
  sc.chain()
    .push(".attr('d', d3.svg.area()")
    .call(".x","function(d) { return "+vg.value(props.x1)+"; }")
    .call(".y1","function(d) { return "+vg.value(props.y1)+"; }")
    .call(".y0","function(d) { return "+vg.value(props.y2)+"; }");
  if (props.interpolate !== undefined)
    sc.call(".interpolate", vg.value(props.interpolate));
  if (props.tension !== undefined)
    sc.call(".tension", vg.value(props.tension));
  sc.unchain(1, true);

  // encode all other properties
  for (var name in mark.properties) {
    if (vg.mark.spatials[name]) continue;
    var props = mark.properties[name],
        val = vg.value(props);
    if (props.field !== undefined) {
      val = "function(d,i) { return " + val + "; }";
    }
    sc.call(vg.mark.styles[name] ? ".style" : ".attr",
      vg.str(vg.mark.styles[name]||name), val);
  }
  sc.unchain();
};

vg.mark.line = function(mark, index, encoders, sc) {
  var mname = vg.varname("mark", index),
      line = "line"+index,
      props = mark.properties;
    
  // select
  sc.chain()
    .decl(mname, "dom.select('.mark-"+index+"')")
    .call(".selectAll", "'path'")
    .call(".data", "[data['"+mark.from+"']]")
    .unchain();
    
  // exit and enter
  sc.push(mname+".exit().remove();");
  sc.push(mname+".enter().append('path');");

  // update and transition
  sc.chain().push("(duration"
    + " ? " + mname + ".transition().duration(duration)"
    + " : " + mname + ")");

  // encode spatial properties
  sc.chain()
    .push(".attr('d', d3.svg.line()")
    .call(".x","function(d) { return "+vg.value(props.x1)+"; }")
    .call(".y","function(d) { return "+vg.value(props.y1)+"; }");
  if (props.interpolate !== undefined)
    sc.call(".interpolate", vg.value(props.interpolate));
  if (props.tension !== undefined)
    sc.call(".tension", vg.value(props.tension));
  sc.unchain(1, true);  

  // encode all other properties
  for (var name in mark.properties) {
    if (vg.mark.spatials[name]) continue;
    var props = mark.properties[name],
        val = vg.value(props);
    if (props.field !== undefined) {
      val = "function(d,i) { return " + val + "; }";
    }
    sc.call(vg.mark.styles[name] ? ".style" : ".attr",
      vg.str(vg.mark.styles[name]||name), val);
  }
  sc.unchain();
};
vg.encoders = function(spec, sc) {
  if (!spec.encoders) return;
  spec.encoders.forEach(function(enc, index) {
    if (index > 0) sc.push();
    vg.encoder.init(enc, sc);
  });
};

vg.encoder = {};
vg.encoder.meta = {"name":true, "type":true};
vg.encoder.registry = {};

vg.encoder.register = function(name, pkg) {
  pkg = vg.isFunction(pkg) ? pkg() : pkg;
  if (vg.isObject(pkg.method) && !vg.isFunction(pkg.method)) {
    for (var methodName in pkg.method) {
      var enc = vg.clone(pkg);
      enc.method = pkg.method[methodName];
      var registryName = name + (methodName ? "."+methodName : "");
      vg.encoder.registry[registryName] = enc;
    }
  } else {
    vg.encoder.registry[name] = pkg;
  }
};

vg.encoder.init = function(def, sc) {
  var type = def.type.split("."),
      encoder = vg.encoder.registry[type.shift()];
  if (!encoder) {
    vg.error("Unrecognized encoder type: "+def.type);
  }
  var method = encoder.method;
  if (vg.isFunction(method)) {
    method = method(type.join("."));
  } 
  if (method === undefined) return;
  
  sc.chain().push("encoders['"+def.name+"'] = "+method+"()");  
  if (encoder.init) encoder.init(def, sc);
  sc.unchain();
};

vg.encoder.start = function(def, spec, mark, index, sc) {
  var type = def.type.split("."),
      encoder = vg.encoder.registry[type[0]];
  if (encoder.start) encoder.start(def, spec, mark, index, sc);  
};

vg.encoder.encode = function(def, spec, mark, index, sc) {
  var type = def.type.split("."),
      encoder = vg.encoder.registry[type[0]];
  if (encoder.encode) encoder.encode(def, spec, mark, index, sc);  
};

vg.encoder.finish = function(def, spec, mark, index, sc) {
  var type = def.type.split("."),
      encoder = vg.encoder.registry[type[0]];
  if (encoder.finish) encoder.finish(def, spec, mark, index, sc);
};
vg.encoder.register("geo", function() {

  var input = ["lon", "lat"],
      output = ["x", "y"],
      params = ["center", "scale", "translate",
                "rotate", "precision", "clipAngle"];

  var method = function(projection) {
    return "d3.geo."+projection;
  };

  return {
    input: input,
    output: output,
    params: params,
    method: method,
    
    init: function(def, sc) {
      params.forEach(function(param) {
        if (def[param]) sc.call("."+param, def[param]);
      });
    },
    
    start: function(def, spec, mark, index, sc) {
      sc.chain().decl(vg.varname("geo", index), "encoders['"+def.name+"']");
      params.forEach(function(p) {
        // update parameter if override present
        if (def[p] !== spec[p]) sc.call("."+p, spec[p]);
      });
      sc.unchain();
    },
    
    encode: function(def, spec, mark, index, sc) {
      var name = vg.varname("geo", index),
          lon = vg.value(spec.lon),
          lat = vg.value(spec.lat),
          obj = vg.mark.obj;

      sc.decl("xy", name+"(["+lon+", "+lat+"])")
        .push(obj + ".x = xy[0];")
        .push(obj + ".y = xy[1];");
    },
    
    finish: function(def, spec, mark, index, sc) {
      // return parameters to initial values, if necessary
      var override = params.filter(function(p) { return def[p] !== spec[p]; });
      if (override.length === 0) return;
      sc.chain().push(vg.varname("geo", index));
      override.forEach(function(p) { sc.call("."+param, def[p]); });
      sc.unchain();
    }
  };
  
});vg.encoder.register("geojson", {

  input: ["field"],
  params: ["projection"],
  output: ["path"],
  method: "d3.geo.path",

  init: function(def, sc) {
    if (def.projection) sc.call(".projection", "encoders['"+def.projection+"']");
  },
  
  start: function(def, spec, mark, index, sc) {
    var name = vg.varname("geojson", index);
    sc.chain().decl(name, "encoders['"+spec.name+"']");
    if (spec.projection !== def.projection) {
      // update projection if override present
      sc.call(".projection", "encoders['"+spec.projection+"']")
    }
    sc.unchain();
  },
  
  encode: function(def, spec, mark, index, sc) {
    var name = vg.varname("geojson", index),
        field = vg.value(spec.field);
    sc.push(vg.mark.obj+".path = "+name+"("+field+");");
  },
  
  finish: function(def, spec, mark, index, sc) {
    // return projection to initial value, if necessary
    if (def.projection && spec.projection !== def.projection) {
      var name = vg.varname("geojson", index);
      sc.call(name+".projection", "encoders['"+def.projection+"']");
    }
  }
  
});vg.encoder.register("pie", {

  input: ["field"],
  output: ["startAngle", "endAngle"],
  method: undefined,
    
  start: function(def, spec, mark, index, sc) {
    var name = vg.varname("pie", index);
    sc.chain().decl(name, "d3.layout.pie()").call(".sort","null");
    if (spec.field !== undefined) {
      sc.call(".value", "function(d,i) { return "+vg.value(spec.field)+"; }");
    }
    sc.push("(data['"+mark.from+"'])")
      .unchain();
  },
  
  encode: function(def, spec, mark, index, sc) {
    var name = vg.varname("pie", index);
    sc.push(vg.mark.obj+".startAngle = "+name+"[i].startAngle;")
      .push(vg.mark.obj+".endAngle = "+name+"[i].endAngle;");
  }
  
});vg.encoder.register("symbol", {

  params: ["shape", "size"],
  output: ["path"],
  method: undefined,

  start: function(def, spec, mark, index, sc) {
    var name = vg.varname("symbol", index);
    sc.chain().decl(name, "d3.svg.symbol()");
    if (spec.shape) sc.call(".type", vg.get(spec.shape));
    if (spec.size) sc.call(".size", vg.get(spec.size));
    sc.unchain();
  },
  
  encode: function(def, spec, mark, index, sc) {
    var name = vg.varname("symbol", index);
    sc.push(vg.mark.obj+".path = "+name+"(d);");
  }
  
});vg.dom = function(spec, sc) {
  // create container div
  sc.chain()
    .push("dom = d3.select(el)")
    .call(".append", "'div'");
  if (spec.clientWidth || spec.clientHeight) {
    sc.call(".style", "{"
      + (spec.clientWidth  ? "width:'"  + spec.clientWidth  + "px', " : "")
      + (spec.clientHeight ? "height:'" + spec.clientHeight + "px', " : "")
      + "overflow:'auto'"
      + "}");
  }
  sc.unchain().push();
  
  // create SVG element
  sc.chain()
    .decl("svg", "dom.append('svg')")
    .call(".attr", "'width'", "width + padding.left + padding.right")
    .call(".attr", "'height'", "height + padding.top + padding.bottom")
    .unchain();

  sc.push();
    
  // create root SVG container
  sc.chain()
    .decl("root", "svg.append('g')")
    .call(".attr", "'class'", "root")
    .call(".attr", "'transform'", "'translate('+padding.left+', '+padding.top+')'")
    .unchain();
    
  sc.push();

  // create axes container
  sc.chain()
    .push("root.selectAll('g.axis')")
    .call(".data", "axes")
    .push(".enter().append('g')").indent()
    .call(".attr", "'class'", "function(d, i) { return 'axis axis-'+i; }")
    .unindent()
    .unchain();

  sc.push();

  // create mark containers
  sc.chain()
    .push("root.selectAll('g.mark')")
    .call(".data", "d3.range("+spec.marks.length+")")
    .push(".enter().append('g')").indent()
    .call(".attr", "'class'", "function(d, i) { "
      + "return 'mark mark-'+i; }")
    .unindent()
    .unchain();
};
  
vg.compile = function(spec, template) {
  var js = vg.template(template),
      sc = vg.code();

  var defaults = {
    name: "chart",
    width: 400,
    height: 400,
    padding: {top:30, bottom:30, left:30, right:30}    
  };

  // PARAMETERS
  js.set("NAME", spec.name || defaults.name);
  js.set("WIDTH", spec.width || defaults.width);
  js.set("HEIGHT", spec.height || defaults.height);
  js.set("PADDING", spec.padding || defaults.padding);

  // INITIALIZATION

  // scales
  vg.scales(spec, sc.clear().indent(2));
  js.set("INIT_SCALES", sc.source());

  // encoders
  vg.encoders(spec, sc.clear().indent(2));
  js.set("INIT_ENCODERS", sc.source());

  // axes
  vg.axes(spec, sc.clear().indent(2));
  js.set("INIT_AXES", sc.source());
  
  // DOM element
  vg.dom(spec, sc.clear().indent(2));
  js.set("INIT_DOM", sc.source());
  
  // UPDATE
  
  // axes
  vg.axes.update(spec, sc.clear().indent(2));
  js.set("UPDATE_AXES", sc.source());
  
  // marks
  vg.marks(spec, sc.clear().indent(2));
  js.set("UPDATE_MARKS", sc.source());
  
  return js.toString();
};
})();
