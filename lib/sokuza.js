define("sokuza", ["eweda", "Bindings", "LVar"], function(eweda, Bindings, LVar) {

  eweda.installTo(this);
  
  var F = F || {};

  var EMPTY = F.EMPTY = [];
  var isEmpty = F.isEmpty = function isEmpty(x) {
    return x instanceof Array && x.length === 0;
  };
 
  var succeed = F.succeed = function succeed(result) {
    return [result];
  };
  var fail = F.fail = function fail(result) {
    return EMPTY;
  };

  var disjunction = function disjunction(l, r) {
    return function(x) {
      return cat(l(x), r(x));
    };
  };
  var conjunction = function conjunction(l, r) {
    return function(x) {
      return flatten(map(r, l(x)));
    };
  };
  var disj = F.disj = function disj() {
    var args = Array.prototype.slice.call(arguments);
    if (args.length === 0) {
      return fail;
    }
    return disjunction(car(args), disj.apply(this, cdr(args)));
  };
  var conj = F.conj = function conj() {
    var args = Array.prototype.slice.call(arguments);

    if (isEmpty(args)) {
      return F.succeed;
    }
    if (args.length === 1) {
      return car(args);
    }
    return conjunction(car(args), function(s) {
      return conj.apply(null, cdr(args))(s);
    });
  };
  var lvar = F.lvar = function lvar(name) {
    return new LVar(name);
  };
  var isLvar = F.isLvar = function isLvar(v) {
    return v instanceof LVar;
  };

  var isArray = function isArray(x) {
    return x instanceof Array;
  };

  var eqar = function eqar(x, y) {
    if (!isArray(x) || !isArray(y)) {
      return false;
    }
    return equals(cons(x), cons(y)) && eqar(cdr(x), cdr(y));
  };

  var equals = F.equals = function equals(x, y) {
    if (x === y) {
      return true;
    }
    if (x.equals) {
      return x.equals(y);
    }
    if (isArray(x)) {
      return eqar(x, y);
    }
    return false;
  };

  var unify = F.unify = function unify(t1, t2, s) {
    t1 = s.lookup(t1);
    t2 = s.lookup(t2);
    if (equals(t1, t2)) {
      return s;
    }
    if (LVar.isLvar(t1)) {
      return s.extend(t1, t2);
    }
    if (LVar.isLvar(t2)) {
      return s.extend(t2, t1);
    }
    if (Array.isArray(t1) && Array.isArray(t2)) {
      s = unify(car(t1), car(t2), s);
      return (s.isEmpty()) ? s : unify(cdr(t1), cdr(t2), s);
    }
    return null;
  };

  var goal = F.goal = function goal(l, r) {
    return function(bindings) {
      var result;
      if (equals(l, r)) { 
        return succeed(bindings);
      }
      result = unify(l, r, bindings);
      return (result === null) ? fail(bindings) : succeed(result);
    };
  };
  var run = F.run = function run(goal) {
    return goal(new Bindings());
  };
  var choice = F.choice = function($v, ls) {
    return (isEmpty(ls)) ? fail : disj(goal($v, car(ls)), choice($v, cdr(ls)));
  };
  var commono = F.commono = function commono(l, r) {
    var $x = lvar("$x");
    return conj(choice($x, l), choice($x, r));
  };
  var conso = F.conso = function choice($a, $b, ls) {
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
        if (src.hasOwnProperty(prop)) {
          dest[prop] = src[prop];
        }
      }
    });
    return dest;
  }

  function cat() {
    var args = flatten(Array.prototype.slice.call(arguments));
    return foldl(function(acc, elem) {
      return Array.prototype.concat.call(acc, elem);
    }, [], args);
  }

  return F;
});
