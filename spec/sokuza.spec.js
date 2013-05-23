
F.installTo(this);

describe("mhkanren", function() {
   
    describe("non-deterministic functions", function() {
        function f1(x) { return succeed(x + " f1"); }
        function f2(x) { return succeed(x + " f2"); }
        describe("disj", function() {
            it("returns all the results of f1 and all the results of f2", function() {
                var rv = disj(f1, f2)("test1");
                expect(isPair(rv)).toBe(true);
                expect(car(rv)).toBe("test1 f1");
                expect(car(cdr(rv))).toBe("test1 f2");
            });
            
            it("returns no results only if neither f1 nor f2 returned any results", function() {
                var rv = disj(fail, fail)("test2");
                expect(isEmpty(rv)).toBe(true);
                rv = disj(fail, succeed)("test2");
                expect(car(rv)).toEqual("test2");
                expect(isEmpty(cdr(rv))).toBe(true);
                rv = disj(succeed, fail)("test2");
                expect(car(rv)).toEqual("test2");
                expect(isEmpty(cdr(rv))).toBe(true);
            });
        });
        
        describe("conj", function() {
            it("returns the result of f2 applied to output of f1(x)", function() {
                var rv = conj(f1, f2)("test3");
                expect(car(rv)).toEqual("test3 f1 f2");
                expect(isEmpty(cdr(rv))).toBe(true);
            });
            
            it("returns no results if any of its arguments fails", function() {
                var sf = conj(succeed, fail)("test4");
                var fs = conj(fail, succeed)("test4");
                expect(isEmpty(sf)).toBe(true);
                expect(isEmpty(fs)).toBe(true);
            });
        });
    });
    
    describe("Goals", function() {

        describe("fail", function() {
            it("returns an empty list for any arguments", function() {
                expect(isEmpty(fail(5))).toBe(true);
            });
        });

        describe("succeed", function() {
            it("returns a list containing its (first) argument", function() {
                expect(car(succeed(5))).toEqual(5);
                expect(isEmpty(cdr(succeed(5)))).toBe(true);
            });
        });
        
        describe("unify", function() {
            it("returns the substitution list on success", function() {
                var q = lvar("q");
                var value = true;
                var b = unify(value, q, emptyS);
                expect(isPair(car(b))).toBe(true);
                expect(car(car(b))).toEqual(q);
                expect(cdr(car(b))).toEqual(value);
            });
            
            it("can bind lvar to another lvar", function() {
                var q = lvar("q");
                var p = lvar("p");
                var b = unify(p, q, emptyS);
                expect(car(car(b))).toEqual(p);
                expect(cdr(car(b))).toEqual(q);
            });
            
            it("can bind an lvar to a value", function() {
                var q = lvar("q");
                var p = lvar("p");
                var b = unify(p, q, emptyS);
                var b = unify(q, 1, b);
                expect(lookup(q, b)).toEqual(1);
                expect(lookup(p, b)).toEqual(1);
            });
            
            it("can be composed with itself", function() {
                var q = lvar("q");
                var p = lvar("p");
                var b = unify(p, 1, unify(p, q, emptyS));
                expect(lookup(q, b)).toBe(1); 
            });
        });
        
        describe("goal method", function() {
            it("takes two arguments", function() {
                expect(goal.length).toBe(2);
            });
            it("returns a function", function() {
                var g = goal(1,2);
                expect(typeof g).toBe("function");                
            });
            describe("the function returned from F.goal", function() {
                it("returns a list of bindings (substitutions)", function() {
                    var q = lvar("q");
                    var g = goal(q, true);
                    var r = g(emptyS);
                    expect(isPair(r)).toBe(true);
                    expect(car(car(car(r)))).toEqual(q);
                    expect(cdr(car(car(r)))).toBe(true);
                });
            });
            
        });
        
        describe("choice", function() {
            it("succeeds (non-empty substitutions) if the element is a member of the list", function() {
                var c = run(choice(2, list(1,2,3)));
                expect(isPair(c)).toBe(true); // we have a list of substitutions
                expect(car(c)).toEqual(null); // but there's nothing in it. that's ok.
            });
        
            it("fails (empty substitutions) if the element is not a member of the list", function() {
                var c = run(choice(10, list(1,2,3)));
                expect(isEmpty(c)).toBe(true);
            });
            
            it("returns a list of bindings that an lvar can take in the list", function() {
                var q = lvar("q");
                var c = run(choice(q, list(1,2,3)));
                expect(length(c)).toEqual(3);
                expect(car(car(car(c)))).toEqual(q);
                expect(cdr(car(car(c)))).toEqual(1);
                expect(car(car(car(cdr(c))))).toEqual(q);
                expect(cdr(car(car(cdr(c))))).toEqual(2);
                expect(car(car(car(cdr(cdr(c)))))).toEqual(q);
                expect(cdr(car(car(cdr(cdr(c)))))).toEqual(3);                
            });
        });
        
        describe("commono", function() {
            it("returns an lvar bound to the common element of two lists", function() {
                var c = run(commono(list(5), list(5)));
                expect(car(car(c))).toEqual(lvar("$x"));
                expect(cdr(car(c))).toEqual(5);
            });
            it("returns an lvar bound to the common element of two lists (longer lists)", function() {
                var c = run(commono(list(1,2,3), list(3,4,5)));
                expect(car(car(c))).toEqual(lvar("$x"));
                expect(cdr(car(c))).toEqual(3);
            });
            
            it("returns bindings of an lvar to multiple common elements of two lists", function() {
                var c = run(commono(list(1,2,3), list(3,4,1,7)));
                //expect(length(c)).toBe(2);
                expect(car(car(c))).toEqual(lvar("$x"));
                expect(cdr(car(c))).toEqual(1);
                expect(car(car(cdr(cdr(c))))).toEqual(lvar("$x"));
                expect(cdr(car(cdr(cdr(c))))).toEqual(3);
            });
            
            it("returns an empty list if there are no common elements", function() {
                var c = run(commono(list(11,2,3), list(13, 4, 1, 7)));
                expect(isEmpty(c)).toBe(true);
            });
        });
        
        describe("conso", function() {
            it("conso(a, b, l) succeeds if in the current state of the world, cons(a, b) is the same as l.", function() {
                var c = run(conso(1, list(2, 3), list(1,2,3)));
                expect(car(c).binds).toEqual({});
            });
            
            it("may bind lvar to the list", function() {
                var q = lvar("q");
                var c = run(conso(1, list(2, 3), q));
                var bound = car(c).binds.q;
                expect(bound).toEqual(list(1,2,3));
            });

            it("may bind lvar to a or b", function() {
                var q = lvar("q");
                var p = lvar("p");
                var c = run(F.conso(q, p, list(1,2,3)));
                expect(car(c).binds.q).toEqual(1);
                expect(car(c).binds.p).toEqual(list(2,3));
            });
        });

        describe("joino", function() {
            it("succeeds if l3 is the same as the concatenation of l1 and l2", function() {
                var c = run(F.joino(list(1), list(2), F.lvar("q")));
                expect(car(c).binds.q).toEqual(list(1,2));

                c = F.run(joino(list(1, 2, 3), lvar("q"), list(1,2,3,4,5)));
                expect(car(c).binds.q).toEqual(list(4,5));
// FAILING TESTS
                c = F.run(F.joino(F.lvar("q"), list(4,5), list(1,2,3,4,5)));
                expect(car(c).binds.q).toEqual(list(1,2,3));

                c = F.run(F.joino(F.lvar("q"), F.lvar("p"), list(1,2,3,4,5)));
                expect(car(c).binds.q).toEqual(list(1));
            });

            it("fails if it cannot unify l1 & l2 with l3", function() {
                var c = F.run(F.joino(list(1), list(2), list(1)));
                expect(isEmpty(c)).toBe(true);
            });

        });

    });
/*
    describe("Logic Engine", function() {
        describe("run", function() {
            it("returns an empty list if its goal fails", function() {
                var q = F.lvar("q");
                var p = F.lvar("p");
                expect(F.run(F.fail)).toEqual([]);
                expect(F.run(F.goal(1, false))).toEqual([]);
                expect(F.run(F.goal(1, null))).toEqual([]);
                expect(F.run(F.goal(false, 1))).toEqual([]);
                expect(F.run(F.goal(null, 1))).toEqual([]);
                expect(F.run(F.goal(2, 1))).toEqual([]);
            });
            
            it("returns a non-empty list if its goal succeeds", function() {
                var q = F.lvar("q");
                var b = F.run(F.succeed);
                expect(b instanceof Array).toBe(true);
                expect(b[0].binds).toEqual({});
                b = F.run(F.goal(q, true));
                expect(b instanceof Array).toBe(true);
                expect(b[0].binds).toEqual({q: true});
            });

        });
    });
/**/
});




