LVar = function(name) {
    this.name = name;
};
LVar.isLvar = function(obj) {
    return obj instanceof LVar;
};
LVar.prototype.equals = function(that) {
    return LVar.isLvar(that) && this.name === that.name;
};

module.exports = LVar;
