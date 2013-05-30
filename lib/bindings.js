var F = F || {};

F.Bindings = function(seed) {
  if (seed == null) {
    seed = {};
  }
  this.binds = this.merge({}, seed);
}

F.Bindings.prototype.merge = function(dest) {
  var objs = Array.prototype.slice.call(arguments, 1);
  objs.forEach(function(obj) {
    var p;
    for (p in obj) {
      if (obj.hasOwnProperty(p)) {
        dest[p] = obj[p];
      }
    }
  });
  return dest;
};

F.Bindings.prototype.extend = function(lvar, value) {
  var o = {};
  o[lvar.name] = value;
  return new Bindings(this.merge(this.binds, o));
};

F.Bindings.prototype.has = function(lvar) {
  return this.binds.hasOwnProperty(lvar.name);
};

F.Bindings.prototype.lookup = function(lvar) {
  if (!F.isLvar(lvar)) {
    return lvar;
  }
  if (this.has(lvar)) {
    return this.lookup(this.binds[lvar.name]);
  }
  return lvar;
};

F.Bindings.prototype.isEmpty = function() {
  return Object.keys(this.binds).length === 0;
};

F.Bindings.prototype.unify = function(t1, t2) {
  t1 = this.lookup(t1);
  t2 = this.lookup(t2);
  if (equals(t1, t2)) {
    return this;
  }
  if (isLvar(t1)) {
    return this.extend(t1, t2);
  }
  if (isLvar(t2)) {
    return this.extend(t2, t1);
  }
  if (Array.isArray(t1) && Array.isArray(t2)) {
    s = unify(car(t1), car(t2), s);
    return (this.isEmpty()) ? this : unify(cdr(t1), cdr(t2), s);
  }
  return this;
};


