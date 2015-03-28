var R = require('ramda');
var expect = require('chai').expect;
var S = require("../src/sokuza");

describe("sokuza.js", function() {

    describe("non-deterministic functions", function() {
        function f1(x) { return S.succeed(x + " f1"); }
        function f2(x) { return S.succeed(x + " f2"); }
        describe("disj", function() {
            it("returns all the results of f1 and all the results of f2", function() {
                var rv = S.disj([f1, f2])("test1");
                expect(R.isEmpty(rv)).to.equal(false);
                expect(R.head(rv)).to.equal("test1 f1");
                expect(R.head(R.tail(rv))).to.equal("test1 f2");
            });

            it("returns no results only if neither f1 nor f2 returned any results", function() {
                var rv = S.disj([S.fail, S.fail])("test2");
                expect(R.isEmpty(rv)).to.equal(true);
                rv = S.disj([S.fail, S.succeed])("test2");
                expect(R.head(rv)).to.equal("test2");
                expect(R.isEmpty(R.tail(rv))).to.equal(true);
                rv = S.disj([S.succeed, S.fail])("test2");
                expect(R.head(rv)).to.equal("test2");
                expect(R.isEmpty(R.tail(rv))).to.equal(true);
            });
        });

        describe("conj", function() {
            it("returns the result of f2 applied to output of f1(x)", function() {
                var rv = S.conj(f1, f2)("test3");
                expect(R.head(rv)).toEqual("test3 f1 f2");
                expect(R.isEmpty(R.tail(rv))).to.equal(true);
            });

            it("returns no results if any of its arguments fails", function() {
                var sf = S.conj(succeed, fail)("test4");
                var fs = S.conj(fail, succeed)("test4");
                expect(R.isEmpty(sf)).to.equal(true);
                expect(R.isEmpty(fs)).to.equal(true);
            });
        });
    });

    describe("Goals", function() {

        describe("fail", function() {
            it("returns an empty list for any arguments", function() {
                expect(R.isEmpty(S.fail(5))).to.equal(true);
            });
        });

        describe("succeed", function() {
            it("returns a list containing its (first) argument", function() {
                expect(R.head(S.succeed(5))).toEqual(5);
                expect(R.isEmpty(R.tail(S.succeed(5)))).to.equal(true);
            });
        });

        describe("unify", function() {
            it("returns the substitution list on success", function() {
                var q = S.lvar("q");
                var value = true;
                var b = S.unify(value, q, S.bindings());
                expect(b.binds).toEqual({q: value});
            });

            it("can bind lvar to another lvar", function() {
                var q = S.lvar("q");
                var p = S.lvar("p");
                var b = S.unify(p, q, S.bindings());
                expect(b.binds).toEqual({p: q});
            });

            it("can bind an lvar to a value", function() {
                var q = S.lvar("q");
                var p = S.lvar("p");
                var b = S.unify(p, q, S.bindings());
                b = S.unify(q, 1, b);
                expect(b.lookup(q)).toEqual(1);
                expect(b.lookup(p)).toEqual(1);
            });

            it("can be composed with itself", function() {
                var q = S.lvar("q");
                var p = S.lvar("p");
                var b = S.unify(p, 1, S.unify(p, q, S.bindings()));
                expect(b.lookup(q, b)).to.equal(1);
            });
        });

        describe("goal method", function() {
            it("takes two arguments", function() {
                expect(S.goal.length).to.equal(2);
            });
            it("returns a function", function() {
                var g = S.goal(1,2);
                expect(typeof g).to.equal("function");
            });
            describe("the function returned from goal", function() {
                it("returns a list of bindings (substitutions)", function() {
                    var q = S.lvar("q");
                    var g = S.goal(q, true);
                    var r = g(S.indings());
                    expect(R.isEmpty(r)).to.equal(false);
                    expect(R.head(r).binds).toEqual({q: true});
                });
            });

        });

        describe("choice", function() {
            it("succeeds (non-empty substitutions) if the element is a member of the list", function() {
                var c = S.run(choice(2, [2]));
                expect(R.isEmpty(c)).to.equal(false);
                expect(R.head(c).binds).toEqual({});
                c = S.run(S.choice(2, [1,2,3]));
                expect(R.isEmpty(c)).to.equal(false); // we have a list of substitutions
                expect(R.head(c).binds).toEqual({}); // but there's nothing in it. that's ok.
            });

            it("fails (empty substitutions) if the element is not a member of the list", function() {
                var c = S.run(choice(1, [2]));
                expect(R.isEmpty(c)).to.equal(true);
                c = S.run(S.choice(10, [1,2,3]));
                expect(R.isEmpty(c)).to.equal(true);
            });

            it("returns a list of bindings that an lvar can take in the list", function() {
                var q = S.lvar("q");
                var c = S.run(choice(q, [1,2,3]));
                expect(c.length).toEqual(3);
                expect(c[0].binds.q).toEqual(1);
                expect(c[1].binds.q).toEqual(2);
                expect(c[2].binds.q).toEqual(3);
            });
        });

        describe("commono", function() {
            it("returns an lvar bound to the common element of two lists (1)", function() {
                var c = S.run(commono([5], [5]));
                expect(c.length).toEqual(1);
                expect(c[0].binds["$x"]).toEqual(5);
            });
            it("returns an lvar bound to the common element of two lists (2)", function() {
                var c = S.run(commono([5], [5, 15]));
                expect(c.length).toEqual(1);
                expect(c[0].binds["$x"]).toEqual(5);
            });
            it("returns an lvar bound to the common element of two lists (longer lists)", function() {
                var c = S.run(commono([1,2,3], [3,4,5]));
                expect(c.length).to.equal(1);
                expect(c[0].binds["$x"]).toEqual(3);
            });

            it("returns bindings of an lvar to multiple common elements of two lists", function() {
                var c = S.run(commono([1,2,3], [3,4,1,7]));
                expect(c.length).to.equal(2);
                expect(c[0].binds["$x"]).toEqual(1);
                expect(c[1].binds["$x"]).toEqual(3);
            });

            it("returns an empty list if there are no common elements", function() {
                var c = S.run(commono([11,2,3], [13, 4, 1, 7]));
                expect(R.isEmpty(c)).to.equal(true);
            });
        });

        describe("conso", function() {
            it("conso(a, b, l) succeeds if in the current state of the world, cons(a, b) is the same as l.", function() {
                var c = S.run(conso(1, [2, 3], [1,2,3]));
                expect(R.isEmpty(c)).to.equal(false);
                expect(R.head(c).isEmpty()).to.equal(true);
            });

            it("may bind lvar to the list", function() {
                var q = S.lvar("q");
                var c = S.run(conso(1, [2, 3], q));
                expect(c[0].binds.q).toEqual([1,2,3]);
            });

            it("may bind lvar to a or b", function() {
                var q = S.lvar("q");
                var p = S.lvar("p");
                var c = S.run(conso(q, p, [1,2,3]));
                expect(R.isEmpty(c)).to.equal(false);
            });
        });

        xdescribe("apppendo", function() {
            it("succeeds if l3 is the same as the concatenation of l1 and l2", function() {
                var c = S.run(apppendo([1], [2], S.lvar("q")));
                expect(R.head(c).binds.q).toEqual([1,2]);

                c = S.run(S.apppendo([1, 2, 3], S.lvar("q"), [1,2,3,4,5]));
                expect(R.head(c).binds.q).toEqual([4,5]);

                c = S.run(S.apppendo(S.lvar("q"), [4,5], [1,2,3,4,5]));
                expect(R.head(c).binds.q).toEqual([1,2,3]);

                c = S.run(S.apppendo(S.lvar("q"), S.lvar("p"), [1,2,3,4,5]));
                expect(R.head(c).binds.q).toEqual([1]);
            });

            it("fails if it cannot unify l1 & l2 with l3", function() {
                var c = S.run(S.apppendo([1], [2], [3]));
                expect(R.isEmpty(c)).to.equal(true);
            });

        });

    });


     describe("Logic Engine", function() {
         describe("run", function() {
             it("returns an empty list if its goal fails", function() {
                 var q = S.lvar("q");
                 var p = S.lvar("p");
                 expect(S.run(S.fail)).toEqual([]);
                 expect(S.run(S.goal(1, false))).toEqual([]);
                 expect(S.run(S.goal(1, null))).toEqual([]);
                 expect(S.run(S.goal(false, 1))).toEqual([]);
                 expect(S.run(S.goal(null, 1))).toEqual([]);
                 expect(S.run(S.goal(2, 1))).toEqual([]);
             });

             it("returns a non-empty list if its goal succeeds", function() {
                var q = S.lvar("q");
                var b = S.run(S.succeed);
                expect(b instanceof Array).to.equal(true);
                expect(b[0].binds).toEqual({});
                b = S.run(S.goal(q, true));
                expect(b instanceof Array).to.equal(true);
                expect(b[0].binds).toEqual({q: true});
            });
        });

     });
     /**/
});



