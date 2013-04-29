((root) ->
  root = this
  _ = root._ || require 'underscore'

  F = {}

  F.succeed = (result) -> [result]
  F.fail = _.always []

  F.disj = (l, r) ->
    (x) -> _.cat(l(x), r(x))

  F.conj = (l, r) ->
    (x) -> _.mapcat(l(x), r)

  F.test1 = () ->
    F.disj(
      F.disj(F.fail, F.succeed),
      F.conj(
        F.disj(((x) -> F.succeed(x + 1)),
               ((x) -> F.succeed(x + 10))),
        F.disj(F.succeed, F.succeed)))(100);

  # F.test1();
  #=> [100, 101, 101, 110, 110]

  class LVar
    constructor: (name) ->
      @name = name

  F.lvar = (name) -> new LVar(name)

  F.isLVar = (v) -> (v instanceof LVar)

  F.testLVar = () ->
    v = F.lvar("foo")
    F.isLVar(v)

  class Bindings
    constructor: (seed = {}) ->
      @binds = _.merge({}, seed)
    extend: (lvar, value) =>
      @binds[lvar.name] = value
      this
    lookup: (lvar) ->
      if !F.isLvar(lvar)
        return lvar
      if @binds.hasOwnProperty(lvar.name)
        return this.lookup(@binds[lvar.name])
      lvar

  F.emptyness = () -> new Bindings()

  # exports and sundries

  if module?
    module.exports = F
  else
    root.F = F

)(this)
