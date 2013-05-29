(function(root) {
  var F, LVar, find;
  root = this;

  if (root.Scheme) {
    root.Scheme.equals = function(x, y) {
      return (x === y) ? true :
        (isPair(x) && isPair(y)) ? equals(car(x), car(y)) && equals(cdr(x), cdr(y)) :
          typeof x.equals === "function" ? x.equals(y) : false;
    };
    root.Scheme.installTo(this);
  } else {
    throw new Error("Scheme functions required");
  }
  
  F = {};

  // TODO: do not expose these helpers
  var isNullPair = F.isNullPair = function(p) {
    return isPair(p) && car(p) === null && cdr(p) === null;
  };
  var clean = F.clean = function(ls) {
    if (isEmpty(ls) || isNullPair(ls)) {
      return null;
    }
    if (!isPair(ls)) {
      return ls;
    }
    return (isList(ls)) ? cons(clean(car(ls)), clean(cdr(ls))) :
        cons(car(ls), clean(cdr(ls)));
  };
  
  var succeed = F.succeed = function(result) {
    return list(result);
  };
  var fail = F.fail = function(result) {
    return null;
  };
  var disj = F.disj = function(l, r) {
    return function(x) {
      return append(l(x), r(x));
    };
  };
  var conj = F.conj = function(l, r) {
    return function(x) {
      return flatten(clean(map(r, l(x))));
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

  var emptyS = F.emptyS = null;

  var extS = F.extS = function(v, value, s) {
    return cons(cons(v, value), s);
  };
  var lookup = F.lookup = function(v, s) {
    var match, found;
    if (!isLvar(v) || isEmpty(s)) {
        return v;
    }
    match = assq(v, s); // (x.y) or #f
    if (match)  {
      found = cdr(match);
      if (isLvar(found)) {
        return lookup(found, s);
      } else {
        return found;
      }
    }
    return v;
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
    if (isPair(t1) && isPair(t2)) {
      s = unify(car(t1), car(t2), s);
      return (!isEmpty(s)) ? unify(cdr(t1), cdr(t2), s) : s;
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
      return (result === null) ? fail(bindings) : succeed(result);
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

  if (typeof module !== "undefined" && module !== null) {
    return module.exports = F;
  } else {
    return root.F = F;
  }
})(this);
