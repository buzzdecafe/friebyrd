(function(root) {
  var Bindings, F, LVar, conjunction, disjunction, find, _;

  function asArray(list) {
    var arr = arguments[1] || [];
    return (list && car(list)) ? (arr.push(car(list)), asArray(cdr(list), arr)) : arr;
  }
  function asList(arr) {
    return list.apply(null, arr);
  }

  root = this;
  _ = root._ || require('underscore');
  
  F = {};
  
  // scheme in javascript ....
  var cons = F.cons = function(x, y) {
    var fn = function(pick) {
      return pick(x, y);
    };
    fn.toString = function() {
      return "(" + asArray(this).join(" ") + ")";
    };
    fn.pair = true;
    return fn;
  };
  var car = F.cdr = function(f) {
    return f(function(x, y) { return x; });
  };
  var cdr = F.cdr = function(f) {
    return f(function(x, y) { return y; });
  };
  var pair = F.pair = function(x) { return x.pair; };
  var list = F.list = function() {    
    var args = Array.prototype.slice.call(arguments);
    return (args.length === 0) ? null : cons(args.shift(), list.apply(null, args));
  };
  var append = F.append = (l, m) {
    return (l === null) ? m : cons(car(l), append(cdr(l), m));
  };
  var map = F.map = function(lat, fn) { 
    return (lat === null) ? null : cons(fn(car(lat)), map(cdr(lat), fn)); 
  };
  // end scheme section
  
  F.succeed = function(result) {
    return list(result);
  };
  F.fail = function(result) {
    return list(null);
  };
  disjunction = function(l, r) {
    return function(x) {
      return append(l(x), r(x));
    };
  };
  conjunction = function(l, r) {
    return function(x) {
      return append.apply(map(l(x), r));
    };
  };
  F.disj = function() {
    return (_.isEmpty(arguments)) ? F.fail : disjunction(_.first(arguments), F.disj.apply(this, _.rest(arguments)));
  };
  F.conj = function() {
    var clauses;

    clauses = _.toArray(arguments);
    if (_.isEmpty(clauses)) {
      return F.succeed;
    }
    if (_.size(clauses) === 1) {
      return _.first(clauses);
    }
    return conjunction(_.first(clauses), function(s) {
      return F.conj.apply(null, _.rest(clauses))(s);
    });
  };
  
  // prolog-like logic variables
  LVar = function LVar(name) {
    this.name = name;
  };
  F.lvar = function(name) {
    return new LVar(name);
  };
  F.isLVar = function(v) {
    return v instanceof LVar;
  };
  find = function(v, bindings) {
    var lvar;

    lvar = bindings.lookup(v);
    if (F.isLVar(v)) {
      return lvar;
    }
    if (_.isArray(lvar)) {
      if (_.isEmpty(lvar)) {
        return lvar;
      } else {
        return _.cons(find(_.first(lvar), bindings), find(_.rest(lvar), bindings));
      }
    }
    return lvar;
  };
  Bindings = (function() {
    function Bindings(seed) {
      if (seed == null) {
        seed = {};
      }
      this.binds = _.merge({}, seed);
    }

    Bindings.prototype.extend = function(lvar, value) {
      var o;

      o = {};
      o[lvar.name] = value;
      return new Bindings(_.merge(this.binds, o));
    };

    Bindings.prototype.has = function(lvar) {
      return this.binds.hasOwnProperty(lvar.name);
    };

    Bindings.prototype.lookup = function(lvar) {
      if (!F.isLVar(lvar)) {
        return lvar;
      }
      if (this.has(lvar)) {
        return this.lookup(this.binds[lvar.name]);
      }
      return lvar;
    };

    return Bindings;

  })();
  F.ignorance = new Bindings();
  F.unify = function(l, r, bindings) {
    var t1, t2;

    t1 = bindings.lookup(l);
    t2 = bindings.lookup(r);
    if (_.isEqual(t1, t2)) {
      return bindings;
    }
    if (F.isLVar(t1)) {
      return bindings.extend(t1, t2);
    }
    if (F.isLVar(t2)) {
      return bindings.extend(t2, t1);
    }
    if (_.isArray(t1) && _.isArray(t2)) {
      bindings = F.unify(_.first(t1), _.first(t2), bindings);
      bindings = bindings !== null ? F.unify(_.rest(t1), _.rest(t2), bindings) : bindings;
      return bindings;
    }
    return null;
  };
  F.goal = function(l, r) {
    return function(bindings) {
      var result = F.unify(l, r, bindings);
      return (result !== null) ? F.succeed(result) : F.fail(bindings);
    };
  };
  F.run = function(goal) {
    return goal(F.ignorance);
  };
  F.choice = function($v, list) {
    if (_.isEmpty(list)) {
      return F.fail;
    }
    return F.disj(F.goal($v, _.first(list)), F.choice($v, _.rest(list)));
  };
  F.membero = F.choice;
  F.commono = function(l, r) {
    var $x = F.lvar("x");
    return F.conj(F.choice($x, l), F.choice($x, r));
  };
  F.conso = function($a, $b, list) {
    return F.goal(_.cons($a, $b), list);
  };
  F.joino = function($a, $b, list) {
    return F.goal([$a, $b], list);
  };
  if (typeof module !== "undefined" && module !== null) {
    return module.exports = F;
  } else {
    return root.F = F;
  }
})(this);