define("LVar", function() {
    LVar = function(name) {
        this.name = name;
    };
    LVar.isLvar = function(obj) {
        return obj instanceof LVar;
    };
    LVar.prototype.equals = function(that) {
        return F.isLvar(that) && this.name === that.name;
    };

    return LVar;
});


