(function(root) {
  var F, LVar, find;
  root = this;

  eweda.installTo(this);
  
  F = {};

  var EMPTY = F.EMPTY = [];
  var isEmpty = F.isEmpty = function(x) {
    return x instanceof Array && x.length === 0;
  };

  var isEmptySubs = function(s) {
    return Object.keys(s).length === 0;
  };

 
  var succeed = F.succeed = function(result) {
    return [result];
  };
  var fail = F.fail = function(result) {
    return EMPTY;
  };
  var disj = F.disj = function(l, r) {
    return function(x) {
      return l(x).concat(r(x));
    };
  };
  var conj = F.conj = function(l, r) {
    return function(x) {
      return map(r, l(x));
    };
  };
  
  // prolog-like logic variables
  LVar = function LVar(name) {
    this.name = name;
  };
  LVar.prototype.equals = function(that) {
    return this.name === that.name;
  };
  var lvar = F.lvar = function(name) {
    return new LVar(name);
  };
  var isLvar = F.isLvar = function(v) {
    return v instanceof LVar;
  };

  var emptyS = F.emptyS = {};

  var extS = F.extS = function(v, value, s) {
    return merge({}, s, {v: value});
  };
  

  var lookup = F.lookup = function(v, s) {
    var found = s[v];
    if (typeof found === "undefined") {
      return v;
    }
    if (isLvar(found)) {
      return lookup(found, s);
    } else {
      return found;
    }
    return v;
  };

  var isArray = function(x) {
    return x instanceof Array;
  };

  var eqar = function(x, y) {
    if (!isArray(x) || !isArray(y)) {
      return false;
    }
    return equals(cons(x), cons(y)) && eqar(cdr(x), cdr(y));
  };

  var equals = F.equals = function(x, y) {
    if (x === y) return true;
    if (x.equals) return x.equals(y);
    if (isArray(x)) return eqar(x, y);
    return false;
  };

  var unify = F.unify = function(l, r, s) {
    var t1, t2;

    t1 = lookup(l, s);
    t2 = lookup(r, s);
    if (equals(t1, t2)) {
      return s;
    }
    if (isLvar(t1)) {
      return extS(t1, t2, s);
    }
    if (isLvar(t2)) {
      return extS(t2, t1, s);
    }
    if (isArray(t1) && isArray(t2)) {
      return merge({}, s, unify(car(t1), car(t2), s, unify(cdr(t1), cdr(t2), s));
    }
    return s;
  };
  var goal = F.goal = function(l, r) {
    return function(bindings) {
      var result;
      if (equals(l, r)) { 
        return succeed(bindings);
      }
      result = unify(l, r, bindings);
      return (isEmptySubs(result)) ? fail(bindings) : succeed(result);
    };
  };
  var run = F.run = function(goal) {
    return goal(emptyS);
  };
  var choice = F.choice = function($v, ls) {
    return (isEmpty(ls)) ? fail : disj(goal($v, car(ls)), choice($v, cdr(ls)));
  };
  var commono = F.commono = function(l, r) {
    var $x = lvar("$x");
    return conj(choice($x, l), choice($x, r));
  };
  var conso = F.conso = function($a, $b, ls) {
    return goal(cons($a, $b), ls);
  };

  F.installTo = function(obj) {
    var prop;
    obj = obj || this;
    for (prop in F) {
      if (F.hasOwnProperty(prop)) {
        obj[prop] = F[prop];
      }
    }
    return F;
  };

  function merge(dest) {
    var srcs = Array.prototype.slice.call(arguments, 1);
    srcs.forEach(function(src) {
      var prop;
      for (prop in src) {
        dest[prop] = src[prop];
      }
    });
    return dest;
  }

  if (typeof module !== "undefined" && module !== null) {
    return module.exports = F;
  } else {
    return root.F = F;
  }
})(this);
