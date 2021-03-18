import React from 'react';
const AST = require('./ast');
class Intepreter{
  constructor(){

  }
  isAbs( node){
    return node instanceof AST.Abstraction ;
  }
  isValue( node){
    return node instanceof AST.Abstraction || node instanceof AST.Identifier;
  }
  isIdentifier(node){
    return node instanceof AST.Identifier;
  }
  isReduced(node){
    if(this.isValue(node)){
      return true;
    }
    return this.isReducedApplication(node)
  }
  isReducedApplication(node){
    if(node instanceof AST.Application){
      if(this.isIdentifier(node.lhs)){
        return true;
      }
      if(node.lhs instanceof AST.Application){
        return this.isReducedApplication(node.lhs);
      }
    }
    return false;
  }
  eval(ast,extern = false){
    // console.log("Evaluate AST: "+ast)
    var amt =0;
    while (true) {
      // console.log("Loop3")
      // console.log(ast)
      amt +=1;
      if(amt>100){
        throw new Error("BUGGED OVERFLOW")
      }
      console.log("<AST: "+ ast.toString(['0','1','2','3','4','5','6','7']))
      if (ast instanceof AST.Application) {
        console.log("Application: ")
        ast.lhs = this.eval(ast.lhs);
        if(ast.lhs instanceof AST.Identifier){
          ast.rhs = this.eval(ast.rhs)
        }
        if(this.isAbs(ast.lhs)){
          ast = this.eval(this.substitute(ast.rhs, ast.lhs.body),true);
        }
        return ast
      } else if (this.isAbs(ast) ) {
          if(extern){
            ast.body = this.eval(ast.body,true)
          }
          console.log("-Abstraction :"+ast.toString(['0','1','2','3','4','5','6','7']))
        // console.log(ast.toString())
        /**
         * * `ast` is a value, and therefore an abstraction. That means we're done
          * reducing it, and this is the result of the current evaluation.
          */
        return ast;
      }else if (this.isIdentifier(ast)){
        return ast;
      }
     
      // console.log("pass:" +ast)
    }
  };

  traverse(fn){
    return function(node, ...args) {
      const config = fn(...args);
      if (node instanceof AST.Application)
        return config.Application(node);
      else if (node instanceof AST.Abstraction)
        return config.Abstraction(node);
      else if (node instanceof AST.Identifier)
        return config.Identifier(node);
    }
  }

   shift(by, node){
    const aux = this.traverse(from => ({
      Application(app) {
        return new AST.Application(
          aux(app.lhs, from),
          aux(app.rhs, from)
        );
      },
      Abstraction(abs) {
        return new AST.Abstraction(
          abs.param,
          aux(abs.body, from + 1)
        );
      },
      Identifier(id) {
        return new AST.Identifier(
          id.value + (id.value >= from ? by : 0)
        );
      }
    }));
    return aux(node, 0);
  };

  subst(value, node){
    var interp = this;
    const aux = this.traverse(depth => ({
      Application(app) {
        return new AST.Application(
          aux(app.lhs, depth),
          aux(app.rhs, depth)
        );
      },
      Abstraction(abs) {
        return new AST.Abstraction(
          abs.param,
          aux(abs.body, depth + 1)
        );
      },
      Identifier(id) {
        if (depth === id.value){
          // console.log(interp)
          return interp.shift(depth, value);
        }else
          return id;
      }
    }));
    return aux(node, 0);
  };
  substitute(value, node){
    var res = this.shift(-1, this.subst(this.shift(1, value), node));;
    if( res == null){
      throw new Error("Its null!")
    }
    return res
  };
}

class StepInterpreter extends Intepreter{
  constructor( ast, extern=false){
    super()
    this.ast = ast;
    this.extern = extern;
    this.init = true;
    this.states = {
      UNKNOWN: -1,
      APPLICATION_LHS_EVAL : 0,
      APPLICATION_RHS_EVAL : 1,
      APPLICATION_SUBS_EVAL: 2,
      ABSTRACTION_EVAL: 3,
      IDENTIFIER_EVAL: 4,
      DONE: 5,
      DONE_SKIP: 6,
    }
    this.state = this.determ_state();
    this.lower_interp = null;
  }
  determ_state(){
    if(this.ast instanceof AST.Application){
      return this.states.APPLICATION_LHS_EVAL
    }
    if(this.ast instanceof AST.Abstraction){
      return this.states.ABSTRACTION_EVAL
    }
    if(this.ast instanceof AST.Identifier){
      return this.states.DONE_SKIP
    }
    throw new Error("Not an AST: "+ this.ast)
  }
  step(depth=0){
    var do_again= false;
    console.log(" ".repeat(depth)+" STEP: "+ this.state)
    switch(this.state){
      case this.states.APPLICATION_LHS_EVAL:
        console.log(" ".repeat(depth)+" APPLICATION_LHS_EVAL "+this.ast.toString(['1','2','3','4','5','6','7','8','9','10']))
        if(this.lower_interp == null){
          this.lower_interp = new StepInterpreter(this.ast.lhs)
        }
        this.lower_interp.step(depth+1)
        this.ast.lhs = this.lower_interp.ast;
        if(this.lower_interp.state == this.states.DONE || this.lower_interp.state == this.states.DONE_SKIP){
         
          if(this.ast.lhs instanceof AST.Identifier){
            this.state =  this.states.APPLICATION_RHS_EVAL
            this.init = true;
          } else{
            this.state = this.states.APPLICATION_SUBS_EVAL
            this.init = true;
          }
          if(this.lower_interp.state== this.states.DONE_SKIP){
            do_again= true
          }
          this.lower_interp = null;
        }
        break;
      case this.states.APPLICATION_RHS_EVAL:
        if(this.lower_interp == null){
          this.lower_interp = new StepInterpreter(this.ast.rhs)
        }
        console.log(" ".repeat(depth)+" APPLICATION_RHS_EVAL "+this.ast.toString(['1','2','3','4','5','6','7','8','9','10']))
        this.lower_interp.step(depth+1)
        this.ast.rhs = this.lower_interp.ast;
        if(this.lower_interp.state == this.states.DONE|| this.lower_interp.state == this.states.DONE_SKIP){
          this.state = this.states.APPLICATION_SUBS_EVAL
          this.init = true;
          if(this.lower_interp.state== this.states.DONE_SKIP){
            do_again= true
          }
          this.lower_interp = null;
        }
        break;
      case this.states.APPLICATION_SUBS_EVAL:
        console.log(" ".repeat(depth)+" APPLICATION_SUBS_EVAL "+this.ast.toString(['1','2','3','4','5','6','7','8','9','10']))
        if(this.init && !(this.ast.lhs instanceof AST.Abstraction )){
          this.state= this.states.DONE_SKIP
          break;
        }else{
          console.log(" ".repeat(depth)+" This is abstraction: "+(this.ast.lhs instanceof AST.Identifier));
        }
        this.init = false;
        // console.log(" ".repeat(depth)+ " LHS:"+this.ast.toString(['1','2','3','4','5','6','7','8','9','10']))
        if(this.lower_interp == null){
          this.lower_interp = new StepInterpreter(this.substitute(this.ast.rhs,this.ast.lhs.body),true);
        }
        this.ast = this.lower_interp.ast;
        this.lower_interp.step(depth+1)
        if(this.lower_interp.state == this.states.DONE|| this.lower_interp.state == this.states.DONE_SKIP){
          this.ast = this.lower_interp.ast;
          this.state= this.states.DONE;
          this.init = true;
          if(this.lower_interp.state== this.states.DONE_SKIP){
            do_again= true
          }
          this.lower_interp = null;
        }
        break;
      case this.states.ABSTRACTION_EVAL:
        console.log(" ".repeat(depth)+" ABSTRACTION_EVAL "+this.ast.toString(['1','2','3','4','5','6','7','8','9','10']))
        if( this.init && (! this.extern)){
          this.state= this.states.DONE_SKIP
          break;
        }
        this.init = false;
        if(this.lower_interp == null){
          this.lower_interp = new StepInterpreter(this.ast.body,true)
        }
        this.lower_interp.step(depth+1)
        this.ast.body = this.lower_interp.ast;
        if(this.lower_interp.state == this.states.DONE || this.lower_interp.state == this.states.DONE_SKIP){
          this.state = this.states.DONE
          if(this.lower_interp.state== this.states.DONE_SKIP){
            do_again= true
          }
          this.lower_interp = null;
        }
        break
      case this.states.IDENTIFIER_EVAL:
        console.log(" ".repeat(depth)+" IDENTIFIER_EVAL "+this.ast.toString(['1','2','3','4','5','6','7','8','9','10']))
        this.state= this.states.DONE_SKIP
        break;
    }
    if(do_again){
      this.step(depth)
    } 
  }
}

export {Intepreter as Intepreter,StepInterpreter as StepInterpreter}
// module.exports = Intepreter;