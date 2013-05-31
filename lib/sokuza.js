define("sokuza", ["eweda", "Bindings", "LVar"], function(eweda, Bindings, LVar) {

  eweda.installTo(this);
  
  var F = F || {};

  var EMPTY = F.EMPTY = [];
  var isEmpty = F.isEmpty = function(x) {
    return x instanceof Array && x.length === 0;
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
      return flatten(map(r, l(x)));
    };
  };
  
  var lvar = F.lvar = function(name) {
    return new F.LVar(name);
  };
  var isLvar = F.isLvar = function(v) {
    return v instanceof F.LVar;
  };

  var emptyS = F.emptyS = function() {
    return new F.Bindings();
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

  var goal = F.goal = function(l, r) {
    return function(bindings) {
      var result;
      if (equals(l, r)) { 
        return succeed(bindings);
      }
      result = bindings.unify(l, r);
      return (result.isEmpty()) ? fail(bindings) : succeed(result);
    };
  };
  var run = F.run = function(goal) {
    return goal(emptyS());
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
        if (src.hasOwnProperty(prop)) {
          dest[prop] = src[prop];
        }
      }
    });
    return dest;
  }

  return F;
});
