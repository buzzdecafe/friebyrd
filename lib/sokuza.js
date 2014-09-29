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
  return disjunction(R.car(args), disj.apply(this, R.cdr(arguments)));
}

function conj() {
  switch (arguments.length) {
    case 0: return F.succeed;
    case 1: return car(args);
    default return conjunction(car(args), function(s) {
        return conj.apply(null, R.cdr(arguments))(s);
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
  return equals(car(x), car(y)) && eqar(cdr(x), cdr(y));
}

function equals(x, y) {
  if (x === y) {
    return true;
  }
  if (x === null) {
    return y === null;
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
  if (Array.isArray(t1) && Array.isArray(t2)) {
    s = unify(car(t1), car(t2), s);
    return (s === null || s.isEmpty()) ? s : unify(cdr(t1), cdr(t2), s);
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

