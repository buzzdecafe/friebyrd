(function(root) {
  var F, LVar, find;
  root = this;

  if (root.Scheme) {
    root.Scheme.installTo(this);
  } else {
    throw new Error("Scheme functions required");
  }
  
  F = {};
 
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
      return flatten(map(r, l(x)));
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
  var isLvar = F.isLVar = function(v) {
    return v instanceof LVar;
  };
  find = function(v, bindings) {
    var lvar;

    lvar = bindings.lookup(v);
    if (isLVar(v)) {
      return lvar;
    }
    if (isPair(lvar)) {
      if (isEmpty(lvar)) {
        return lvar;
      } else {
        return cons(find(car(lvar), bindings), find(cdr(lvar), bindings));
      }
    }
    return lvar;
  };

  var emptyS = F.emptyS = list(null);
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
      return isEmpty(s) ? succeed(s) : s;
    }
    if (isLVar(t1)) {
      return extS(t1, t2, s);
    }
    if (isLVar(t2)) {
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
      var result = unify(l, r, bindings);
      return (isEmpty(result)) ? fail(bindings) : succeed(result);
    };
  };
  var run = F.run = function(goal) {
    return goal(emptyS);
  };
  var choice = F.choice = function($v, list) {
    return (isEmpty(list)) ? fail : disj(goal($v, car(list)), choice($v, cdr(list)));
  };
  var commono = F.commono = function(l, r) {
    var $x = lvar("$x");
    return conj(choice($x, l), choice($x, r));
  };
  var conso = F.conso = function($a, $b, list) {
    return goal(cons($a, $b), list);
  };
  var joino = F.joino = function($a, $b, list) {
    return goal(list($a, $b), list);
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
