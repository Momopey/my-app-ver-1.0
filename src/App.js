import logo from './logo.svg';
import React , { useRef, useEffect } from 'react';
import Box from '@material-ui/core/Box';
import './App.css';
import { TextField } from '@material-ui/core';

// Firebase App (the core Firebase SDK) is always required and must be listed first
import firebase from "firebase/app";
// If you are using v7 or any earlier version of the JS SDK, you should import firebase using namespace import
// import * as firebase from "firebase/app"
// // If you enabled Analytics in your project, add the Firebase SDK for Analytics
import "firebase/analytics";

// // Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD_7WrQRvslQYWOGD_6hJ-ZK0X2iqrM77Y",
  authDomain: "storyofcs-1558b.firebaseapp.com",
  projectId: "storyofcs-1558b",
  storageBucket: "storyofcs-1558b.appspot.com",
  messagingSenderId: "200083507264",
  appId: "1:200083507264:web:27137c893a747e02fdf7a5",
  measurementId: "G-BFZT5N1E9W"
};
firebase.initializeApp(firebaseConfig);

const AST = require("./lambdacalc/ast.js")
const Lexer = require("./lambdacalc/lexer.js").Lexer;
const Parser = require('./lambdacalc/parser').Parser;
const Interpreter = require('./lambdacalc/interpreter').Intepreter;
const StepInterpreter = require('./lambdacalc/interpreter').StepInterpreter;

function Square(props) {
  return (
    <button className="square" onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  constructor(props){
    super(props)
    this.state ={
      squares: Array(9).fill(null),
      xIsNext: true,
    }
  }
  handleClick(i){
      const squares = this.state.squares.slice();
      squares[i] = "X";
      this.setState({squares:squares})
  }
  renderSquare(i) {
    return <Square 
    value={this.state.squares[i]}
    onClick = {()=>this.handleClick(i)} />;
  }
  render() {
    const status = 'Next player: X';
    return (
      <div>
        <div className="status">{status}</div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    );
  }
}

class Game extends React.Component {
  render() {
    return (
      <div className="game">
        <div className="game-board">
          <Board />
        </div>
        <div className="game-info">
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      </div>
    );
  }
}
// (\a.\b.a b)
const Canvas = props => {
  
  const canvasRef = useRef(null)
  const drawAST = (ctx,ast,x,y,cont=[],depth=0) =>{
    // (\hello.hello)
    if(ast instanceof AST.Abstraction){
      ctx.font = '20px serif';
      ctx.fillStyle = '#0CBABA';
      ctx.strokeStyle = '#0CBABA';
      ctx.fillRect(x,y,ctx.measureText(ast.param).width+20,20);
      ctx.beginPath();
      ctx.moveTo(x,y)
      ctx.lineTo(x,y+20+30)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#380036';
      ctx.fillText(ast.param,x+6,y+20-2)
      ctx.fill()
      drawAST(ctx,ast.body,x,y+20+30,[ast.param].concat(cont),depth+1)
    }
    if(ast instanceof AST.Identifier){
      ctx.font = '20px serif';
      ctx.fillStyle = '#0CBABA';
      ctx.strokeStyle = '#0CBABA';
      var val= cont[ast.value]
      ctx.fillRect(x,y,ctx.measureText(val).width+20,20);
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#380036';
      ctx.fillText(val,x+6,y+20-2)
      ctx.fill()
    }
    if(ast instanceof AST.Application){
      ctx.font = '20px serif';
      ctx.fillStyle = '#0CBABA';
      ctx.strokeStyle = '#0CBABA';
      ctx.beginPath();
      ctx.moveTo(x,y)
      ctx.lineTo(x-200/(depth+1),y+20+10)
      ctx.moveTo(x,y)
      ctx.lineTo(x+200/(depth+1),y+20+10)
      ctx.fill()
      ctx.stroke()
      drawAST(ctx,ast.lhs,x-200/(depth+1),y+20+10,cont.slice(),depth+1)
      drawAST(ctx,ast.rhs,x+200/(depth+1),y+20+10,cont.slice(),depth+1)
    }
    
  }

  const draw = (ctx,frameCount) =>{
    ctx.fillStyle = '#000000'
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    if(props.ast!= null){
      drawAST(ctx,props.ast,ctx.canvas.width/2,20)
    }
  }
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    let frameCount = 0
    let animationFrameId
    
    //Our draw came here
    const render = () => {
      frameCount++
      draw(context, frameCount)
      animationFrameId = window.requestAnimationFrame(render)
    }
    render()
    
    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [draw])
  
  return <canvas ref={canvasRef} className = "Vis-canvas" {...props}/>
}


class LambdaMachine extends React.Component{
  constructor(props){
    super(props)
    this.state= {
      // lambda_input: "(λa. (λb.( (λf. (λx. f x)) a b))  )",
      // lambda_input: "Ln.Lf.Lx. (n f) x ",
      // lambda_input: "(Ln.Lf.Lx. f (n f x) ) ( Lf.Lx. f (x ) ) ",
      // lambda_input: "(Lm.Ln.Lf.Lx. (m f )(n f x) )(Lf.Lx.f(x)) (Lf.Lx.f(f(x)))",
      lambda_input: "(Lm.Ln.Lf.Lx. (m f )(n f x) )(Lf.Lx.f(f(x))) (Lf.Lx.f(x))",
      // lambda_input: "(λf. (λx. (f (f (((λf. (λx. (f x))) f) x)))))",
      lambda_ast: null,
      lambda_output: "?",
    }
    this.onChange = this.onChange.bind(this)
    this.onButtonClick = this.onButtonClick.bind(this)
    this.onLambdaChange = this.onLambdaChange.bind(this)
    this.setText = this.setText.bind(this)
  }
  onLambdaChange(){
    var tex = this.state.lambda_ast.toString()+ ( (this.state.stepInterp.state ==5)? " == " :" => " ) +this.state.out_ast.toString();
    this.setState({lambda_output: tex});
  }
  onChange(newComp){
    this.setText(newComp.target.value)
  }
  setText(text){
    this.setState({lambda_input: text});
    var valid= this.parseLambda(text, this.onLambdaChange)
    if(!valid){
      this.setState({lambda_output: "-err-"});
    }
  }
  // Lf.((Lx.((f)((x)(x))))(Lx.((f)((x)(x))))) 
  // (La.a)
//   (\zero.
//     (\succ. 
//         (\add.
//             (\pred.
//             add ( succ (succ zero) ) (succ zero)
//             )(\x.x)
//         )(Lm.Ln.Lf.Lx. (m f )(n f x) )
//     )(\n.\f.\x. f( n f x )) 
// )(\f.\x. x)

/*

<!-- The core Firebase JS SDK is always required and must be listed first -->
<script src="/__/firebase/8.3.0/firebase-app.js"></script>

<!-- TODO: Add SDKs for Firebase products that you want to use
     https://firebase.google.com/docs/web/setup#available-libraries -->
<script src="/__/firebase/8.3.0/firebase-analytics.js"></script>

<!-- Initialize Firebase -->
<script src="/__/firebase/init.js"></script>


   (\zero.
     (\succ. 
        (\add.
            (\pred.
                (\subt.
                    (\mult.
                        (\exp.
                            (\true.
                                (\false.
                                    (\and.
                                        (\or.
                                            (\not.
                                                (\isZero.
                                                    (\isLEQ.
                                                        (\isEQ.
                                                            (\yComb.
  yComb (\f.\n.( (isZero n) (succ zero) (mult n (f(pred n)))))  (succ (succ (succ (succ zero))))
                                                            )(\f.(\x.f(x x)) (\x.f(x x)))
                                                        )(\m.\n. and (isLEQ m n)(isLEQ n m))
                                                    )(\m.\n. isZero (subt m n))
                                                )(\n.n (\x. false) true)
                                            )(\p.\a.\b. p b a)
                                        )(\p.\q. p p q)
                                    )(\p.\q. p q p)
                                )(\a.\b.b)
                            )(\a.\b.a)
                        )(\m.\n.\f.\x. (n m) f x)
                    )(\m.\n.\f.\x. m (n f) x)
                )(\m.\n. n pred m)
            )(\n.\f.\x.n (\g.\h. h(g f))(\u.x)(\u.u))
        )(Lm.Ln.Lf.Lx. (m f )(n f x) )
    )(\n.\f.\x. f( n f x )) 
)(\f.\x. x)
*/
  parseLambda(lambda,callback){
    // if(lambda == "(lx.x)y"){
    //   return [true,"y"]
    // }
    // return [false,"-err-"]
    try{
      const lexer = new Lexer(lambda+" ");
      console.log(lexer)
      const parser = new Parser(lexer);
      console.log(parser)
      const ast = parser.parse();
      // this.setState({lambda_ast:ast})
      console.log("Parsed!")
      console.log(this.state.lambda_ast)
      console.log("hello")
      console.log(ast)
      const stepInterp = new StepInterpreter(ast,true);
      // this.setState({stepInterp:stepInterp})
      console.log(stepInterp)
      
      const interp = new Interpreter();
      // console.log(interp
      console.log("Interpereting::")
      var out= interp.eval(ast.copy(),true);
      var out_tex =  out.toString();
      // this.setState({out_tex,out_tex})

     
      
      // var out = "?"
      console.log(out_tex)
      this.setState({
        lambda_ast:ast,
        stepInterp: stepInterp,
        out_ast: out
      },callback)
      return true;
    }catch(err){
      console.log(err)
      return false
    }
  }
  onButtonClick(amt){
    console.log("CLicky!")
    // console.log(this)
    if (this.state.stepInterp != null){
      for(var i = 0;i<amt;i++){
        if(this.state.stepInterp.state != 5){
          this.state.stepInterp.step();  
        }else{
          break;
        }
      }
      this.setState({
        lambda_ast:this.state.stepInterp.ast,
      },this.onLambdaChange)
      console.log(this.state.stepInterp);
      console.log("L: "+ this.state.stepInterp.ast)
     
    }
  }
  render(){
    return( 
      <Box display="flex" flexDirection="column" p={1} m={1} width="90%">
         <Box p={1} bgcolor="black">
            <button className="square" onClick={()=>{this.setText("(λtrue.\n    (λfalse.\n        (λand.\n            (λor.\n                (λnot.\nnot (and true true)\n                )(λp.λa.λb. p b a)\n            )(λp.λq. p p q)\n        )(λp.λq. p q p)\n    )(λa.λb.b)\n)(λa.λb.a)"

            )}}> 
              binary encodings
            </button>
            {/* <button className="square" onClick={()=>{this.onButtonClick(10)}}> 
              natural number (and zero) encodings
            </button>
            <button className="square" onClick={()=>{this.onButtonClick(100)}}> 
              factorial
            </button> */}
          </Box>
          <Box p={1} bgcolor="black">
            {/* <input type="text" value= {this.state.lambda_input} id="fname" name="fname" className = "Typing-input" onChange={this.onChange}>
              </input> */}
              <textarea type="text" value= {this.state.lambda_input} id="fname" name="fname" className = "Typing-input" onChange={this.onChange}> hello chungus </textarea>
          </Box>
          <Box p={1} bgcolor="black">
            <label className = "Typing-label"> 
              {this.state.lambda_output}
            </label>
          </Box>
          <Box p={1} bgcolor="black">
            <button className="square" onClick={()=>{this.onButtonClick(1)}}> 
            step
            </button>
            <button className="square" onClick={()=>{this.onButtonClick(10)}}> 
              step*10
            </button>
            <button className="square" onClick={()=>{this.onButtonClick(100)}}> 
              step*100
            </button>
          </Box>
          <Box p={1} bgcolor="black">
              <Canvas width="1000" height="1000" ast = {this.state.lambda_ast}> Javascript needed.
              </Canvas>
          </Box>
          
        </Box>
    )
  }
  componentDidMount(){
    var textarea = document.getElementsByTagName('textarea')[0]; 
    textarea.onkeydown = function(event) {
      //support tab on textarea
      if (event.keyCode == 9) { //tab was pressed
          var newCaretPosition;
          newCaretPosition = textarea.getCaretPosition() + "    ".length;
          textarea.value = textarea.value.substring(0, textarea.getCaretPosition()) + "    " + textarea.value.substring(textarea.getCaretPosition(), textarea.value.length);
          textarea.setCaretPosition(newCaretPosition);
          return false;
      }
      if(event.keyCode == 8){ //backspace
          if (textarea.value.substring(textarea.getCaretPosition() - 4, textarea.getCaretPosition()) == "    ") { //it's a tab space
              var newCaretPosition;
              newCaretPosition = textarea.getCaretPosition() - 3;
              textarea.value = textarea.value.substring(0, textarea.getCaretPosition() - 3) + textarea.value.substring(textarea.getCaretPosition(), textarea.value.length);
              textarea.setCaretPosition(newCaretPosition);
          }
      }
      if(event.keyCode == 37){ //left arrow
          var newCaretPosition;
          if (textarea.value.substring(textarea.getCaretPosition() - 4, textarea.getCaretPosition()) == "    ") { //it's a tab space
              newCaretPosition = textarea.getCaretPosition() - 3;
              textarea.setCaretPosition(newCaretPosition);
          }    
      }
      if(event.keyCode == 39){ //right arrow
          var newCaretPosition;
          if (textarea.value.substring(textarea.getCaretPosition() + 4, textarea.getCaretPosition()) == "    ") { //it's a tab space
              newCaretPosition = textarea.getCaretPosition() + 3;
              textarea.setCaretPosition(newCaretPosition);
          }
      } 
    }
  }
}
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <LambdaMachine/>
      </header>
    </div>
  );
}


export default App;
