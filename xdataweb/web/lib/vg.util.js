if (typeof vg === 'undefined') { vg = {}; }

vg.unique = function(data, field) {
  var results = [], v;
  for (var i=0; i<data.length; ++i) {
    v = data[i][field];
    if (results.indexOf(v) < 0) results.push(v);
  }
  return results;
};

vg.flatten = function(data) {
  var result = [];
  data.forEach(function(d) {
    d.forEach(function(x) { result.push(x); });
  });
  return result;
};

vg.columns = function(data, values, names) {
  values = values === undefined ? "values" : values;
  names = names === undefined ? "name" : names;
  var table = [],
      cols = data.length,
      rows = data[0][values].length,
      r, c, col, t;

  for (r=0; r<rows; ++r) {
    t = {};
    for (col=data[c=0]; c<cols; col=data[++c]) {
      t[col[name]] = col[values][r];
    }
    table.push(t);
  }
  return table;
};

vg.rank = function(data, sort, field) {
  field = field || "index";
  (sort ? vg.sort(data, sort) : data)
    .forEach(function(d,i) { d[field] = i; });
  return data;
};

vg.sort = function(data, sort) {
  return data.slice().sort(vg.cmp(sort));
};

vg.group = function(data, keys, sort, rank) {
  if (keys === undefined) keys = [];
  keys = Array.isArray(keys) ? keys : [keys];
  var map = {}, result = [],
      list, klist, kstr, i, j, k, kv, cmp;

  for (i=0; i<data.length; ++i) {
    for (k=0, klist=[], kstr=""; k<keys.length; ++k) {
      kv = data[i][keys[k]];
      klist.push(kv);
      kstr += (k>0 ? "|" : "") + String(kv);
    }
    list = map[kstr];
    if (list === undefined) {
      list = (map[kstr] = []);
      list.key = kstr;
      list.keys = klist;
      result.push(list);
    }
    list.push(data[i]);
  }

  if (sort) {
    cmp = vg.cmp(sort);
    for (i=0; i<result.length; ++i) {
      result[i].sort(cmp);
    }
  }
  
  if (rank) {
    for (i=0; i<result.length; ++i) {
      vg.rank(result[i], rank===true ? undefined : rank);
    }
  }

  return result;
};

vg.cmp = function(sort) {
  var sign = [];
  if (sort === undefined) sort = [];
  sort = (Array.isArray(sort) ? sort : [sort]).map(function(f) {
    var s = 1;
    if (f[0] === "-") {
      s = -1; f = f.slice(1);
    } else if (field[0] === "+") {
      f = f.slice(1);
    }
    sign.push(s);
    return f;
  });
  return function(a,b) {
    var i, s;
    for (i=0; i<sort.length; ++i) {
      s = sort[i];
      if (a[s] < b[s]) return -1 * sign[i];
      if (a[s] > b[s]) return sign[i];
    }
    return 0;
  };
};

vg.tree = function(data, keys) {
  var root = {key:"root", depth:0, values:[], leaves:data},
      map = {}, nodes = (root.nodes = [root]),
      p, c, i, len, k, kv, klen, kstr, name;
  keys = (keys || []);

  for (i=0, len=data.length; i<len; ++i) {
    n = data[i];
    for (p=c=root, k=0, klen=keys.length, key=""; k<klen; ++k, p=c) {
      kv = data[i][keys[k]];
      key += (k>0 ? "|" : "") + (name = String(kv));
      if (!(c = map[key])) {
        c = (map[key] = {key: name, depth: p.depth + 1, values: []});
        p.values.push(c);
        nodes.push(c);
      }
    }
    n.depth = p.depth + 1;
    c.values.push(n);
    nodes.push(n);
  }
  return root;
};

vg.reduce = function(data, fn, value, keys) {
  var map = {}, result = [];
  
  function next(d) {
    var k, klist, kstr, kv, obj;
    for (k=0, klist=[], kstr=""; k<keys.length; ++k) {
      kv = d[keys[k]];
      klist.push(kv);
      kstr += (k>0 ? "|" : "") + String(kv);
    }
    obj = map[kstr];
    if (obj === undefined) {
      obj = (map[kstr] = {});
      obj.key = kstr;
      obj.keys = klist;
      obj.count = 0;
      obj.value = fn.init || 0;
      result.push(obj);
    }
    obj.count = obj.count + 1;
    obj.value = fn.update(obj, obj.value, d[value]);
  }
  
  // compute reductions
  var group = vg.isGroup(data, value);
  data.forEach(group ? function(d) { d.forEach(next); } : next);
  if (fn.done) {
    result.forEach(group ? function(d) { d.forEach(fn.done); } : fn.done);
  }
  return result;
};

vg.isGroup = function(data, value) {
  return Array.isArray(data[0]) && data[0][value] === undefined;
};

vg.reduce.count = {
  update: function(obj, a, b) { return a + 1; }
};

vg.reduce.sum = {
  update: function(obj, a, b) { return a + b; }
};

vg.reduce.average = {
  update: function(obj, a, b) { return a + b; },
  done: function(obj) { return obj.value / obj.count; }
};

vg.reduce.median = {
  init: [],
  update: function(obj, a, b) { a.push(b); },
  done: function(obj) { return obj.value[obj.count >> 1]; }
};