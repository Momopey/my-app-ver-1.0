import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
HTMLTextAreaElement.prototype.getCaretPosition = function () { //return the caret position of the textarea
  return this.selectionStart;
};
HTMLTextAreaElement.prototype.setCaretPosition = function (position) { //change the caret position of the textarea
  this.selectionStart = position;
  this.selectionEnd = position;
  this.focus();
};
HTMLTextAreaElement.prototype.hasSelection = function () { //if the textarea has selection then return true
  if (this.selectionStart == this.selectionEnd) {
      return false;
  } else {
      return true;
  }
};
HTMLTextAreaElement.prototype.getSelectedText = function () { //return the selection text
  return this.value.substring(this.selectionStart, this.selectionEnd);
};
HTMLTextAreaElement.prototype.setSelection = function (start, end) { //change the selection area of the textarea
  this.selectionStart = start;
  this.selectionEnd = end;
  this.focus();
};




// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
