(function(root) {
  var Bindings, F, LVar, conjunction, disjunction, find;

  function merge(dest) {
    var args = Array.prototype.slice.call(arguments, 1);
    args.forEach(function(obj) {
      var prop;
      for (prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          dest[prop] = obj[prop];
        }
      }
    });
    return dest;
  }

  function isEqual(x, y) {
    // primitive equality & object identity
    if (x === y) {
      return true;
    }
    // object method (for lvar)
    if (x.isEqual) {
      return x.isEqual(y);
    }
    // list
    if (isPair(x) && isPair(y)) {
      return eq(x, y);
    }
    return false;
  }
  root = this;
  
  F = {};
  // scheme in javascript ....
  var cons = F.cons = function(x, y) {
    var fn = function(pick) {
      return pick(x, y);
    };
//    fn.toString = function() {
//      return "(" + asArray(this).join(" ") + ")";
//    };
    fn.pair = true;
    return fn;
  };
  var car = F.car = function(f) {
    return f(function(x, y) { return x; });
  };
  var cdr = F.cdr = function(f) {
    return f(function(x, y) { return y; });
  };
  var isPair = F.isPair = function(x) { return x && x.pair; };
  var list = F.list = function() {    
    var args = Array.prototype.slice.call(arguments);
    return (args.length === 0) ? null : cons(args.shift(), list.apply(null, args));
  };
  var isList = F.isList = function(x) {
    return isPair(x) && (cdr(x) === null || isPair(cdr(x)));
  };
  var append = F.append = function(l, m) {
    return (l === null && m === null) ? list(null) :
      (l === null) ? m : cons(car(l), append(cdr(l), m));
  };
  var map = F.map = function(lat, fn) { 
    return (lat === null) ? null : cons(fn(car(lat)), map(cdr(lat), fn)); 
  };
  var flatten = F.flatten = function(ls) {
    var head, tail;
    if (isEmpty(ls)) {
      return null;
    }
    head = car(ls);
    tail = cdr(ls);
    return isList(head) ? append(flatten(head), flatten(tail)) : cons(head, flatten(tail));
  };
  var eq = F.eq = function(ls1, ls2) {
    if (ls1 === null) {
      return ls2 === null;
    }
    if (ls2 === null) {
      return false;
    }
    return eq(car(ls1), car(ls2)) && eq(cdr(ls1), cdr(ls2));
  };
  var length = F.length = function(ls) {
    return (isEmpty(ls)) ? 0 : 1 + length(cdr(ls));
  };
  var isEmpty = F.isEmpty = function(ls) {
    return ls === null || car(ls) === null;
  };
  var assq = F.assq = function(k, pairs) {
    return (isEmpty(pairs)) ? false :
      (isEqual(car(car(pairs)), k)) ? car(pairs) : assq(k, cdr(pairs));
  };
  
  function asArray(list) {
    var arr = arguments[1] || [];
    if (isEmpty(list)) {
      return arr;
    } else if (isPair(list)) {
      arr.push(car(list));
      return asArray(cdr(list), arr);
    } else { // it's an atom
        arr.push(list);
        return arr;
    }
  }
  function asList(arr) {
    return list.apply(null, arr);
  }

  // end scheme section
 
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
      return flatten(map(l(x), r));
    };
  };
  
  // prolog-like logic variables
  LVar = function LVar(name) {
    this.name = name;
  };
  LVar.prototype.isEqual = function(that) {
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
    if (isEqual(t1, t2)) {
      return s;
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
    return emptyS;
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
