var R = require('ramda');
var LVar = require('LVar');
var Bindings = require('Bindings');

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


function disj() {
  if (arguments.length === 0) {
    return fail;
  }
  return disjunction(R.head(arguments), disj(R.tail(arguments)));
}

function conj() {
  switch (arguments.length) {
    case 0: return succeed;
    case 1: return head(args);
    default return conjunction(car(args), function(s) {
        return conj(R.tail(arguments))(s);
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

function eqar(x, y) {
  if (!isArray(x) || !isArray(y)) {
    return false;
  }
  if (R.isEmpty(x)) {
    return R.isEmpty(y);
  }
  return equals(R.head(x), R.head(y)) && eqar(R.tail(x), R.tail(y));
}

function equals(x, y) {
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
  return (R.isEmpty(ls)) ? fail : disj(goal($v, car(ls)), choice($v, cdr(ls)));
}

function commono(l, r) {
  var $x = lvar("$x");
  return conj(choice($x, l), choice($x, r));
}

function choice($a, $b, ls) {
  return goal(cons($a, $b), ls);
}

module.exports = {
  succeed: R.of,
  fail: R.empty,
  disjunction: disjunction,
  conjunction: conjunction,
  disj: disj,
  conj: conj,
  lvar: lvar,
  isLvar: isLvar,
  eqar: eqar,
  equals: equals,
  unify: unify,
  goal: goal,
  run: run,
  choice: choice,
  commono: commono,
  choice: choice
};

