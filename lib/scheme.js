(function(global) {

  var S = {};
  
  var equals = S.equals = function(x, y) {
    return (x === y) ? true : 
      (isPair(x) && isPair(y)) ? equals(car(x), car(y)) && equals(cdr(x), cdr(y)) : false;
  }
  // fundamentals
  var cons = S.cons = function(x, y) {
    var fn = function(pick) {
      return pick(x, y);
    };
    fn.pair = true;
    fn.equals = function(that) {
      return equals(this, that);
    };
    return fn;
  };
  var car = S.car = function(f) {
    return f(function(x, y) { return x; });
  };
  var cdr = S.cdr = function(f) {
    return f(function(x, y) { return y; });
  };
  var list = S.list = function() {    
    var args = Array.prototype.slice.call(arguments);
    return (args.length === 0) ? null : cons(args.shift(), list.apply(null, args));
  };
  
  // types
  var isPair = S.isPair = function(x) { return x && x.pair; };
  var isList = S.isList = function(x) {
    return isPair(x) && (cdr(x) === null || isPair(cdr(x)));
  };
  var isTuple = S.isTuple = function(x) {
    return isPair(x) && !isList(x);
  };
  var isEmpty = S.isEmpty = function(ls) {
    return ls === null || car(ls) === null;
  };
  var eq = S.eq = function(ls1, ls2) {
    if (ls1 === null) {
      return ls2 === null;
    }
    if (ls2 === null) {
      return false;
    }
    if (ls1 === ls2 || (ls1.equals && ls1.equals(ls2))) {
      return true;
    }      
    return eq(car(ls1), car(ls2)) && eq(cdr(ls1), cdr(ls2));
  };
  
  // list manipulation
  var append = S.append = function(l, m) {
    return (isEmpty(l)) ? m : cons(car(l), append(cdr(l), m));
  };
  var map = S.map = function(fn, lat) { 
    return (isEmpty(lat)) ? null : cons(fn(car(lat)), map(fn, cdr(lat))); 
  };
  var flatten = S.flatten = function(ls) {
    var head, tail;
    if (isEmpty(ls)) {
      return null;
    }
    head = car(ls);
    tail = cdr(ls);
    return isList(head) ? append(flatten(head), flatten(tail)) : cons(head, flatten(tail));
  };
  var length = S.length = function(ls) {
    return (isEmpty(ls)) ? 0 : 1 + length(cdr(ls));
  };
  var assq = S.assq = function(k, pairs) {
    return (isEmpty(pairs)) ? false :
      (equals(car(car(pairs)), k)) ? car(pairs) : assq(k, cdr(pairs));
  };
  
  S.installTo = function(obj) {
    var prop;
    obj = obj || this;
    for (prop in S) {
      if (S.hasOwnProperty(prop)) {
        obj[prop] = S[prop];
      }
    }
    return S;
  };
  
  global.Scheme = S;
}(this));
