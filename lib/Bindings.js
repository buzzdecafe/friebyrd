define("Bindings", ["LVar"], function(LVar) {

    Bindings = function(seed) {
        if (seed == null) {
            seed = {};
        }
        this.binds = this.merge({}, seed);
    }

    Bindings.prototype.merge = function(dest) {
        var objs = Array.prototype.slice.call(arguments, 1);
        objs.forEach(function(obj) {
            var p;
            for (p in obj) {
                if (obj.hasOwnProperty(p)) {
                    dest[p] = obj[p];
                }
            }
        });
        return dest;
    };

    Bindings.prototype.extend = function(lvar, value) {
        var o = {};
        o[lvar.name] = value;
        return new Bindings(this.merge({}, this.binds, o));
    };

    Bindings.prototype.has = function(lvar) {
        return this.binds.hasOwnProperty(lvar.name);
    };

    Bindings.prototype.lookup = function(lvar) {
        if (!LVar.isLvar(lvar)) {
            return lvar;
        }
        if (this.has(lvar)) {
            return this.lookup(this.binds[lvar.name]);
        }
        return lvar;
    };

    Bindings.prototype.isEmpty = function() {
        return Object.keys(this.binds).length === 0;
    };

    Bindings.prototype.unify = function(t1, t2) {
        t1 = this.lookup(t1);
        t2 = this.lookup(t2);
        if (equals(t1, t2)) {
            return this;
        }
        if (LVar.isLvar(t1)) {
            return this.extend(t1, t2);
        }
        if (LVar.isLvar(t2)) {
            return this.extend(t2, t1);
        }
        if (Array.isArray(t1) && Array.isArray(t2)) {
            s = this.unify(car(t1), car(t2), s);
            return (this.isEmpty()) ? this : this.unify(cdr(t1), cdr(t2));
        }
        return this;
    };

    Bindings.prototype.toString = function() {
      return this.binds.toString();
    };

    return Bindings;
});


