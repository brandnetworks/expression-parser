import {OPERATORS, ESCAPE} from './constants';
import {isDefined} from './helpers';

export default class Lexer {

  constructor(options) {
    this.options = options;
  }

  lex(text) {
    this.text = text;
    this.index = 0;
    this.tokens = [];

    while (this.index < this.text.length) {
      let ch = this.text.charAt(this.index);
      if (ch === '"' || ch === '\'') {
        this.readString(ch);
      } else if (this.isNumber(ch) || ch === '.' && this.isNumber(this.peek())) {
        this.readNumber();
      } else if (this.isIdent(ch)) {
        this.readIdent();
      } else if (this.is(ch, '(){}[].,;:?')) {
        this.tokens.push({ index: this.index, text: ch });
        this.index++;
      } else if (this.isWhitespace(ch)) {
        this.index++;
      } else {
        let ch2 = ch + this.peek();
        let ch3 = ch2 + this.peek(2);
        let op1 = OPERATORS[ch];
        let op2 = OPERATORS[ch2];
        let op3 = OPERATORS[ch3];
        if (op1 || op2 || op3) {
          let token = op3 ? ch3 : (op2 ? ch2 : ch);
          this.tokens.push({ index: this.index, text: token, operator: true });
          this.index += token.length;
        } else {
          this.throwError('Unexpected next character', this.index, this.index + 1);
        }
      }
    }
    return this.tokens;
  }

  is(ch, chars) {
    return chars.indexOf(ch) !== -1;
  }

  peek(i) {
    let num = i || 1;
    return (this.index + num < this.text.length) ? this.text.charAt(this.index + num) : false;
  }

  isNumber(ch) {
    return ('0' <= ch && ch <= '9') && typeof ch === 'string';
  }

  isWhitespace(ch) {
    // IE treats non-breaking space as \u00A0
    return (ch === ' ' || ch === '\r' || ch === '\t' ||
    ch === '\n' || ch === '\v' || ch === '\u00A0');
  }

  isIdent(ch) {
    return ('a' <= ch && ch <= 'z' ||
    'A' <= ch && ch <= 'Z' ||
    '_' === ch || ch === '$');
  }

  isExpOperator(ch) {
    return (ch === '-' || ch === '+' || this.isNumber(ch));
  }

  throwError(error, start, end) {
    end = end || this.index;
    let colStr = (isDefined(start)
      ? 's ' + start + '-' + this.index + ' [' + this.text.substring(start, end) + ']'
      : ' ' + end);
    throw Error(`Lexer Error: ${error} at column${colStr} in expression [${this.text}].`);
  }

  readNumber() {
    let number = '';
    let start = this.index;
    while (this.index < this.text.length) {
      let ch = this.text.charAt(this.index).toLowerCase();
      if (ch === '.' || this.isNumber(ch)) {
        number += ch;
      } else {
        let peekCh = this.peek();
        if (ch === 'e' && this.isExpOperator(peekCh)) {
          number += ch;
        } else if (this.isExpOperator(ch) &&
          peekCh && this.isNumber(peekCh) &&
          number.charAt(number.length - 1) === 'e') {
          number += ch;
        } else if (this.isExpOperator(ch) &&
          (!peekCh || !this.isNumber(peekCh)) &&
          number.charAt(number.length - 1) === 'e') {
          this.throwError('Invalid exponent');
        } else {
          break;
        }
      }
      this.index++;
    }
    this.tokens.push({
      index: start,
      text: number,
      constant: true,
      value: Number(number)
    });
  }

  readIdent() {
    let start = this.index;
    while (this.index < this.text.length) {
      let ch = this.text.charAt(this.index);
      if (!(this.isIdent(ch) || this.isNumber(ch))) {
        break;
      }
      this.index++;
    }
    this.tokens.push({
      index: start,
      text: this.text.slice(start, this.index),
      identifier: true
    });
  }

  readString(quote) {
    let start = this.index;
    this.index++;
    let string = '';
    let rawString = quote;
    let escape = false;
    while (this.index < this.text.length) {
      let ch = this.text.charAt(this.index);
      rawString += ch;
      if (escape) {
        if (ch === 'u') {
          let hex = this.text.substring(this.index + 1, this.index + 5);
          if (!hex.match(/[\da-f]{4}/i)) {
            this.throwError('Invalid unicode escape [\\u' + hex + ']');
          }
          this.index += 4;
          string += String.fromCharCode(parseInt(hex, 16));
        } else {
          let rep = ESCAPE[ch];
          string = string + (rep || ch);
        }
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === quote) {
        this.index++;
        this.tokens.push({
          index: start,
          text: rawString,
          constant: true,
          value: string
        });
        return;
      } else {
        string += ch;
      }
      this.index++;
    }
    this.throwError('Unterminated quote', start);
  }
}
