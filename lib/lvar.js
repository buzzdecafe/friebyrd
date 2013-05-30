var F = F || {};

F.LVar = function(name) {
  this.name = name;
};

F.LVar.prototype.equals = function(that) {
  return F.isLvar(that) && this.name === that.name;
};


