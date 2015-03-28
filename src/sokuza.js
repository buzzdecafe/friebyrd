var R = require('ramda');
var LVar = require('./LVar');
var Bindings = require('./Bindings');

var succeed = R.of;
var fail = R.empty;

function disjunction(l, r) {
  return function(x) {
    return R.concat(l(x), r(x));
  };
}

function conjunction(l, r) {
  return function(x) {
    return R.unnest(R.map(r, l(x)));
  };
}

function disj(fns) {
  return fns.length === 0 ? fail :
    disjunction(R.head(fns), disj(R.tail(fns)));
}

function conj(fns) {
  switch (fns.length) {
    case 0: return succeed;
    case 1: return R.head(fns);
    default: return conjunction(R.head(fns), function(s) {
        return conj(R.tail(fns))(s);
    });
  }
}

function lvar(name) {
  return new LVar(name);
}

function isLvar(v) {
  return v instanceof LVar;
}

var isArray = R.is(Array);

function equals(x, y) {
  if (x === y) {
    return true;
  }
  if (x.equals) {
    return x.equals(y);
  }
  return R.eqDeep(x, y);
}

function unify(t1, t2, s) {
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
  if (R.isArray(t1) && R.isArray(t2)) {
    s = unify(R.head(t1), R.head(t2), s);
    return (s === null || s.isEmpty()) ? s : unify(R.tail(t1), R.tail(t2), s);
  }
  return null;
}

function goal(l, r) {
  return function(bindings) {
    var result;
    if (equals(l, r)) { 
      return succeed(bindings);
    }
    result = unify(l, r, bindings);
    return (result === null) ? fail(bindings) : succeed(result);
  };
}

function run(goal) {
  return goal(new Bindings());
}

function choice($v, ls) {
  return (R.isEmpty(ls)) ? fail : disj(goal($v, R.head(ls)), choice($v, R.tail(ls)));
}

function commono(l, r) {
  var $x = lvar("$x");
  return conj(choice($x, l), choice($x, r));
}

function choice($a, $b, ls) {
  return goal(cons($a, $b), ls);
}

function bindings() {
  return new Bindings();
}

module.exports = {
  bindings: bindings,
  choice: choice,
  commono: commono,
  conj: conj,
  conjunction: conjunction,
  disj: disj,
  disjunction: disjunction,
  equals: equals,
  fail: fail,
  goal: goal,
  isLvar: isLvar,
  lvar: lvar,
  run: run,
  succeed: succeed,
  unify: unify,
};

