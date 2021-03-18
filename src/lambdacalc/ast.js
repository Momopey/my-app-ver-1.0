import React from 'react';
class Abstraction {
    /**
     * param here is the name of the variable of the abstraction. Body is the
     * subtree  representing the body of the abstraction.
     */
    constructor(param, body) {
      this.param = param;
      this.body = body;
    }
  
    toString(ctx=[]) {
      return `(λ${this.param}. ${this.body.toString([this.param].concat(ctx))})`;
    }
    copy(){
      return new Abstraction(this.param,this.body.copy())
    }
  }
  
  class Application {
    /**
     * (lhs rhs) - left-hand side and right-hand side of an application.
     */
    constructor(lhs, rhs) {
      this.lhs = lhs;
      this.rhs = rhs;
    }
  
    toString(ctx) {
      return `(${this.lhs.toString(ctx)} ${this.rhs.toString(ctx)})`;
    }
    copy(){
      return new Application(this.lhs.copy(),this.rhs.copy())
    }
  }
  
  class Identifier {
    /**
     * name is the string matched for this identifier.
     */
    constructor(value) {
      this.value = value;
    }
  
    toString(ctx) {
      if(ctx== null){
        return "null"
      }

      return ctx[this.value];
    }
    copy(){
      return new Identifier(this.value)
    }
  }
  export {Abstraction as Abstraction,Application as Application,Identifier as Identifier}
  // exports.Abstraction = Abstraction;
  // exports.Application = Application;
  // exports.Identifier = Identifier;