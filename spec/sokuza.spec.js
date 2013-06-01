require(["sokuza"], function(sokuza) {
    sokuza.installTo(this);

    describe("sokuza.js", function() {

        describe("non-deterministic functions", function() {
            function f1(x) { return succeed(x + " f1"); }
            function f2(x) { return succeed(x + " f2"); }
            describe("disj", function() {
                it("returns all the results of f1 and all the results of f2", function() {
                    var rv = disj(f1, f2)("test1");
                    expect(isEmpty(rv)).toBe(false);
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
                    var b = unify(value, q, new Bindings());
                    expect(b instanceof Bindings).toBe(true);
                    expect(b.binds).toEqual({q: value});
                });

                it("can bind lvar to another lvar", function() {
                    var q = lvar("q");
                    var p = lvar("p");
                    var b = unify(p, q, new Bindings());
                    expect(b.binds).toEqual({p: q});
                });

                it("can bind an lvar to a value", function() {
                    var q = lvar("q");
                    var p = lvar("p");
                    var b = unify(p, q, new Bindings());
                    b = unify(q, 1, b);
                    expect(b.lookup(q)).toEqual(1);
                    expect(b.lookup(p)).toEqual(1);
                });

                it("can be composed with itself", function() {
                    var q = lvar("q");
                    var p = lvar("p");
                    var b = unify(p, 1, unify(p, q, new Bindings()));
                    expect(b.lookup(q, b)).toBe(1);
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
                describe("the function returned from goal", function() {
                    it("returns a list of bindings (substitutions)", function() {
                        var q = lvar("q");
                        var g = goal(q, true);
                        var r = g(new Bindings());
                        expect(isEmpty(r)).toBe(false);
                        expect(car(r).binds).toEqual({q: true});
                    });
                });

            });

            describe("choice", function() {
                it("succeeds (non-empty substitutions) if the element is a member of the list", function() {
                    var c = run(choice(2, [2]));
                    expect(isEmpty(c)).toBe(false);
                    expect(car(c).binds).toEqual({});
                    c = run(choice(2, [1,2,3]));
                    expect(isEmpty(c)).toBe(false); // we have a list of substitutions
                    expect(car(c).binds).toEqual({}); // but there's nothing in it. that's ok.
                });

                it("fails (empty substitutions) if the element is not a member of the list", function() {
                    var c = run(choice(1, [2]));
                    expect(isEmpty(c)).toBe(true);
                    c = run(choice(10, [1,2,3]));
                    expect(isEmpty(c)).toBe(true);
                });

                it("returns a list of bindings that an lvar can take in the list", function() {
                    var q = lvar("q");
                    var c = run(choice(q, [1,2,3]));
                    expect(c.length).toEqual(3);
                    expect(c[0].binds.q).toEqual(1);
                    expect(c[1].binds.q).toEqual(2);
                    expect(c[2].binds.q).toEqual(3);
                });
            });

            describe("commono", function() {
                it("returns an lvar bound to the common element of two lists (1)", function() {
                    var c = run(commono([5], [5]));
                    expect(c.length).toEqual(1);
                    expect(c[0].binds["$x"]).toEqual(5);
                });
                it("returns an lvar bound to the common element of two lists (2)", function() {
                    var c = run(commono([5], [5, 15]));
                    expect(c.length).toEqual(1);
                    expect(c[0].binds["$x"]).toEqual(5);
                });
                it("returns an lvar bound to the common element of two lists (longer lists)", function() {
                    var c = run(commono([1,2,3], [3,4,5]));
                    expect(c.length).toBe(1);
                    expect(c[0].binds["$x"]).toEqual(3);
                });

                it("returns bindings of an lvar to multiple common elements of two lists", function() {
                    var c = run(commono([1,2,3], [3,4,1,7]));
                    expect(c.length).toBe(2);
                    expect(c[0].binds["$x"]).toEqual(1);
                    expect(c[1].binds["$x"]).toEqual(3);
                });

                it("returns an empty list if there are no common elements", function() {
                    var c = run(commono([11,2,3], [13, 4, 1, 7]));
                    expect(isEmpty(c)).toBe(true);
                });
            });

            describe("conso", function() {
                it("conso(a, b, l) succeeds if in the current state of the world, cons(a, b) is the same as l.", function() {
                    var c = run(conso(1, [2, 3], [1,2,3]));
                    expect(isEmpty(c)).toBe(false);
                    expect(car(c).isEmpty()).toBe(true);
                });

                it("may bind lvar to the list", function() {
                    var q = lvar("q");
                    var c = run(conso(1, [2, 3], q));
                    expect(c[0].binds.q).toEqual([1,2,3]);
                });

                it("may bind lvar to a or b", function() {
                    var q = lvar("q");
                    var p = lvar("p");
                    var c = run(conso(q, p, [1,2,3]));
                    expect(isEmpty(c)).toBe(false);
                });
            });

            xdescribe("apppendo", function() {
                it("succeeds if l3 is the same as the concatenation of l1 and l2", function() {
                    var c = run(apppendo([1], [2], lvar("q")));
                    expect(car(c).binds.q).toEqual([1,2]);

                    c = run(apppendo([1, 2, 3], lvar("q"), [1,2,3,4,5]));
                    expect(car(c).binds.q).toEqual([4,5]);

                    c = run(apppendo(lvar("q"), [4,5], [1,2,3,4,5]));
                    expect(car(c).binds.q).toEqual([1,2,3]);

                    c = run(apppendo(lvar("q"), lvar("p"), [1,2,3,4,5]));
                    expect(car(c).binds.q).toEqual([1]);
                });

                it("fails if it cannot unify l1 & l2 with l3", function() {
                    var c = run(apppendo([1], [2], [3]));
                    expect(isEmpty(c)).toBe(true);
                });

            });

        });


         describe("Logic Engine", function() {
             describe("run", function() {
                 it("returns an empty list if its goal fails", function() {
                     var q = lvar("q");
                     var p = lvar("p");
                     expect(run(fail)).toEqual([]);
                     expect(run(goal(1, false))).toEqual([]);
                     expect(run(goal(1, null))).toEqual([]);
                     expect(run(goal(false, 1))).toEqual([]);
                     expect(run(goal(null, 1))).toEqual([]);
                     expect(run(goal(2, 1))).toEqual([]);
                 });

                 it("returns a non-empty list if its goal succeeds", function() {
                    var q = lvar("q");
                    var b = run(succeed);
                    expect(b instanceof Array).toBe(true);
                    expect(b[0].binds).toEqual({});
                    b = run(goal(q, true));
                    expect(b instanceof Array).toBe(true);
                    expect(b[0].binds).toEqual({q: true});
                });
            });

         });
         /**/
    });

});


