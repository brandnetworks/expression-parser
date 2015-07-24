var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : factory(global.ExpressionParser = {});
})(this, function (exports) {
  'use strict';

  var _AST$PRECEDENCE;

  var OPERATORS = {
    '+': true,
    '-': true,
    '*': true,
    '/': true,
    '%': true,
    '==': true,
    '!=': true,
    '<': true,
    '>': true,
    '<=': true,
    '>=': true,
    '&&': true,
    '||': true,
    '!': true,
    '=': true,
    '|': true
  };

  var ESCAPE = {
    'n': '\n',
    'f': '\f',
    'r': '\r',
    't': '\t',
    'v': '\v',
    '\'': '\'',
    '"': '"'
  };

  var getPrototypeOf = Object.getPrototypeOf;

  function isUndefined(value) {
    return typeof value === 'undefined';
  }

  function isDefined(value) {
    return typeof value !== 'undefined';
  }

  function isObject(value) {
    return value !== null && typeof value === 'object';
  }

  function isString(value) {
    return typeof value === 'string';
  }

  function isBoolean(value) {
    return typeof value === 'boolean';
  }

  function helpers__isNumber(value) {
    return typeof value === 'number';
  }

  function isDate(value) {
    return toString.call(value) === '[object Date]';
  }

  var isArray = Array.isArray;

  function isFunction(value) {
    return typeof value === 'function';
  }

  function isRegExp(value) {
    return toString.call(value) === '[object RegExp]';
  }

  function copy(source) {
    if (isArray(source)) {
      return source.map(copy);
    } else if (isDate(source)) {
      return new Date(source.getTime());
    } else if (isRegExp(source)) {
      var dest = new RegExp(source.source, source.toString().match(/[^\/]*$/)[0]);
      dest.lastIndex = source.lastIndex;
      return dest;
    } else if (helpers__isNumber(source) || isString(source) || isBoolean(source) || isFunction(source)) {
      return source;
    } else {
      var dest = {};
      for (var key in source) {
        if (source.hasOwnProperty(key)) {
          dest[key] = copy(source[key]);
        }
      }
      return dest;
    }
  }

  function defaults() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var defaults_ = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    Object.keys(defaults_).forEach(function (key) {
      if (typeof options[key] === 'undefined') {
        options[key] = copy(defaults_[key]);
      }
    });
    return options;
  }

  var Lexer = (function () {
    function Lexer(options) {
      _classCallCheck(this, Lexer);

      this.options = options;
    }

    _createClass(Lexer, [{
      key: 'lex',
      value: function lex(text) {
        this.text = text;
        this.index = 0;
        this.tokens = [];

        while (this.index < this.text.length) {
          var ch = this.text.charAt(this.index);
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
            var ch2 = ch + this.peek();
            var ch3 = ch2 + this.peek(2);
            var op1 = OPERATORS[ch];
            var op2 = OPERATORS[ch2];
            var op3 = OPERATORS[ch3];
            if (op1 || op2 || op3) {
              var token = op3 ? ch3 : op2 ? ch2 : ch;
              this.tokens.push({ index: this.index, text: token, operator: true });
              this.index += token.length;
            } else {
              this.throwError('Unexpected next character', this.index, this.index + 1);
            }
          }
        }
        return this.tokens;
      }
    }, {
      key: 'is',
      value: function is(ch, chars) {
        return chars.indexOf(ch) !== -1;
      }
    }, {
      key: 'peek',
      value: function peek(i) {
        var num = i || 1;
        return this.index + num < this.text.length ? this.text.charAt(this.index + num) : false;
      }
    }, {
      key: 'isNumber',
      value: function isNumber(ch) {
        return '0' <= ch && ch <= '9' && typeof ch === 'string';
      }
    }, {
      key: 'isWhitespace',
      value: function isWhitespace(ch) {
        // IE treats non-breaking space as \u00A0
        return ch === ' ' || ch === '\r' || ch === '\t' || ch === '\n' || ch === '\v' || ch === ' ';
      }
    }, {
      key: 'isIdent',
      value: function isIdent(ch) {
        return 'a' <= ch && ch <= 'z' || 'A' <= ch && ch <= 'Z' || '_' === ch || ch === '$';
      }
    }, {
      key: 'isExpOperator',
      value: function isExpOperator(ch) {
        return ch === '-' || ch === '+' || this.isNumber(ch);
      }
    }, {
      key: 'throwError',
      value: function throwError(error, start, end) {
        end = end || this.index;
        var colStr = isDefined(start) ? 's ' + start + '-' + this.index + ' [' + this.text.substring(start, end) + ']' : ' ' + end;
        throw Error('Lexer Error: ' + error + ' at column' + colStr + ' in expression [' + this.text + '].');
      }
    }, {
      key: 'readNumber',
      value: function readNumber() {
        var number = '';
        var start = this.index;
        while (this.index < this.text.length) {
          var ch = this.text.charAt(this.index).toLowerCase();
          if (ch === '.' || this.isNumber(ch)) {
            number += ch;
          } else {
            var peekCh = this.peek();
            if (ch === 'e' && this.isExpOperator(peekCh)) {
              number += ch;
            } else if (this.isExpOperator(ch) && peekCh && this.isNumber(peekCh) && number.charAt(number.length - 1) === 'e') {
              number += ch;
            } else if (this.isExpOperator(ch) && (!peekCh || !this.isNumber(peekCh)) && number.charAt(number.length - 1) === 'e') {
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
    }, {
      key: 'readIdent',
      value: function readIdent() {
        var start = this.index;
        while (this.index < this.text.length) {
          var ch = this.text.charAt(this.index);
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
    }, {
      key: 'readString',
      value: function readString(quote) {
        var start = this.index;
        this.index++;
        var string = '';
        var rawString = quote;
        var escape = false;
        while (this.index < this.text.length) {
          var ch = this.text.charAt(this.index);
          rawString += ch;
          if (escape) {
            if (ch === 'u') {
              var hex = this.text.substring(this.index + 1, this.index + 5);
              if (!hex.match(/[\da-f]{4}/i)) {
                this.throwError('Invalid unicode escape [\\u' + hex + ']');
              }
              this.index += 4;
              string += String.fromCharCode(parseInt(hex, 16));
            } else {
              var rep = ESCAPE[ch];
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
    }]);

    return Lexer;
  })();

  exports.Lexer = Lexer;

  var _ast__DEFAULT_OPTIONS = {};

  var AST = (function () {
    function AST(lexer, options) {
      _classCallCheck(this, AST);

      this.lexer = lexer;
      this.options = defaults(options, _ast__DEFAULT_OPTIONS);
      this.constants = {
        'true': { type: AST.Literal, value: true },
        'false': { type: AST.Literal, value: false },
        'null': { type: AST.Literal, value: null },
        'undefined': { type: AST.Literal, value: undefined }
      };
    }

    _createClass(AST, [{
      key: 'ast',
      value: function ast(text) {
        this.text = text;
        this.tokens = this.lexer.lex(text);

        var value = this.filterChain();
        if (this.peek(';')) {
          // Allow trailing semicolon, not required
          this.expect(';');
        }
        if (this.tokens.length !== 0) {
          this.throwError('is an unexpected token', this.tokens[0]);
        }
        return value;
      }
    }, {
      key: 'filterChain',
      value: function filterChain() {
        var left = this.expression();
        var token = undefined;
        while (token = this.expect('|')) {
          left = this.filter(left);
        }
        return left;
      }
    }, {
      key: 'expression',
      value: function expression() {
        return this.ternary();
      }
    }, {
      key: 'ternary',
      value: function ternary() {
        var test = this.logicalOR();
        var alternate = undefined;
        var consequent = undefined;
        if (this.expect('?')) {
          consequent = this.expression();
          if (this.consume(':')) {
            alternate = this.expression();
            return { type: AST.ConditionalExpression, test: test, consequent: consequent, alternate: alternate };
          }
        }
        return test;
      }
    }, {
      key: 'logicalOR',
      value: function logicalOR() {
        var left = this.logicalAND();
        while (this.expect('||')) {
          left = { type: AST.LogicalExpression, operator: '||', left: left, right: this.logicalAND() };
        }
        return left;
      }
    }, {
      key: 'logicalAND',
      value: function logicalAND() {
        var left = this.equality();
        while (this.expect('&&')) {
          left = { type: AST.LogicalExpression, operator: '&&', left: left, right: this.equality() };
        }
        return left;
      }
    }, {
      key: 'equality',
      value: function equality() {
        var left = this.relational();
        var token = undefined;
        while (token = this.expect('==', '!=')) {
          left = { type: AST.BinaryExpression, operator: token.text, left: left, right: this.relational() };
        }
        return left;
      }
    }, {
      key: 'relational',
      value: function relational() {
        var left = this.additive();
        var token = undefined;
        while (token = this.expect('<', '>', '<=', '>=')) {
          left = { type: AST.BinaryExpression, operator: token.text, left: left, right: this.additive() };
        }
        return left;
      }
    }, {
      key: 'additive',
      value: function additive() {
        var left = this.multiplicative();
        var token = undefined;
        while (token = this.expect('+', '-')) {
          left = { type: AST.BinaryExpression, operator: token.text, left: left, right: this.multiplicative() };
        }
        return left;
      }
    }, {
      key: 'multiplicative',
      value: function multiplicative() {
        var left = this.unary();
        var token = undefined;
        while (token = this.expect('*', '/', '%')) {
          left = { type: AST.BinaryExpression, operator: token.text, left: left, right: this.unary() };
        }
        return left;
      }
    }, {
      key: 'unary',
      value: function unary() {
        var token = undefined;
        if (token = this.expect('+', '-', '!')) {
          return { type: AST.UnaryExpression, operator: token.text, prefix: true, argument: this.unary() };
        } else {
          return this.primary();
        }
      }
    }, {
      key: 'primary',
      value: function primary() {
        var primary = undefined;
        if (this.expect('(')) {
          primary = this.filterChain();
          this.consume(')');
        } else if (this.expect('[')) {
          primary = this.arrayDeclaration();
        } else if (this.expect('{')) {
          primary = this.object();
        } else if (this.constants.hasOwnProperty(this.peek().text)) {
          primary = copy(this.constants[this.consume().text]);
        } else if (this.peek().identifier) {
          primary = this.identifier();
        } else if (this.peek().constant) {
          primary = this.constant();
        } else {
          this.throwError('not a primary expression', this.peek());
        }

        var next = undefined;
        while (next = this.expect('(', '[', '.')) {
          if (next.text === '[') {
            primary = { type: AST.MemberExpression, object: primary, property: this.expression(), computed: true };
            this.consume(']');
          } else if (next.text === '.') {
            primary = { type: AST.MemberExpression, object: primary, property: this.identifier(), computed: false };
          } else {
            this.throwError('IMPOSSIBLE');
          }
        }
        return primary;
      }
    }, {
      key: 'filter',
      value: function filter(baseExpression) {
        var args = [baseExpression];
        var result = { type: AST.CallExpression, callee: this.identifier(), arguments: args, filter: true };

        while (this.expect(':')) {
          args.push(this.expression());
        }

        return result;
      }
    }, {
      key: 'identifier',
      value: function identifier() {
        var token = this.consume();
        if (!token.identifier) {
          this.throwError('is not a valid identifier', token);
        }
        return { type: AST.Identifier, name: token.text };
      }
    }, {
      key: 'constant',
      value: function constant() {
        // TODO check that it is a constant
        return { type: AST.Literal, value: this.consume().value };
      }
    }, {
      key: 'arrayDeclaration',
      value: function arrayDeclaration() {
        var elements = [];
        if (this.peekToken().text !== ']') {
          do {
            if (this.peek(']')) {
              // Support trailing commas
              break;
            }
            elements.push(this.expression());
          } while (this.expect(','));
        }
        this.consume(']');

        return { type: AST.ArrayExpression, elements: elements };
      }
    }, {
      key: 'object',
      value: function object() {
        var properties = [],
            property = undefined;
        if (this.peekToken().text !== '}') {
          do {
            if (this.peek('}')) {
              // Support trailing commas
              break;
            }
            property = { type: AST.Property, kind: 'init' };
            if (this.peek().constant) {
              property.key = this.constant();
            } else if (this.peek().identifier) {
              property.key = this.identifier();
            } else {
              this.throwError('invalid key', this.peek());
            }
            this.consume(':');
            property.value = this.expression();
            properties.push(property);
          } while (this.expect(','));
        }
        this.consume('}');

        return { type: AST.ObjectExpression, properties: properties };
      }
    }, {
      key: 'throwError',
      value: function throwError(msg, token) {
        throw Error('Syntax Error: Token \'' + token.text + '\' ' + msg + ' at column ' + (token.index + 1) + ' of the expression [' + this.text + '] starting at [' + this.text.substring(token.index) + '].');
      }
    }, {
      key: 'consume',
      value: function consume(e1) {
        if (this.tokens.length === 0) {
          throw Error('Unexpected end of expression: ' + this.text);
        }

        var token = this.expect(e1);
        if (!token) {
          this.throwError('is unexpected, expecting [' + e1 + ']', this.peek());
        }
        return token;
      }
    }, {
      key: 'peekToken',
      value: function peekToken() {
        if (this.tokens.length === 0) {
          throw Error('Unexpected end of expression: ' + this.text);
        }
        return this.tokens[0];
      }
    }, {
      key: 'peek',
      value: function peek(e1, e2, e3, e4) {
        return this.peekAhead(0, e1, e2, e3, e4);
      }
    }, {
      key: 'peekAhead',
      value: function peekAhead(i, e1, e2, e3, e4) {
        if (this.tokens.length > i) {
          var token = this.tokens[i];
          var t = token.text;
          if (t === e1 || t === e2 || t === e3 || t === e4 || !e1 && !e2 && !e3 && !e4) {
            return token;
          }
        }
        return false;
      }
    }, {
      key: 'expect',
      value: function expect(e1, e2, e3, e4) {
        var token = this.peek(e1, e2, e3, e4);
        if (token) {
          this.tokens.shift();
          return token;
        }
        return false;
      }
    }]);

    return AST;
  })();

  AST.ConditionalExpression = 'ConditionalExpression';
  AST.LogicalExpression = 'LogicalExpression';
  AST.BinaryExpression = 'BinaryExpression';
  AST.UnaryExpression = 'UnaryExpression';
  AST.CallExpression = 'CallExpression';
  AST.MemberExpression = 'MemberExpression';
  AST.Identifier = 'Identifier';
  AST.Literal = 'Literal';
  AST.ArrayExpression = 'ArrayExpression';
  AST.Property = 'Property';
  AST.ObjectExpression = 'ObjectExpression';

  AST.PRECEDENCE = (_AST$PRECEDENCE = {}, _defineProperty(_AST$PRECEDENCE, AST.ConditionalExpression, 1), _defineProperty(_AST$PRECEDENCE, AST.LogicalExpression, 1), _defineProperty(_AST$PRECEDENCE, AST.BinaryExpression, 2), _defineProperty(_AST$PRECEDENCE, AST.UnaryExpression, 3), _defineProperty(_AST$PRECEDENCE, AST.CallExpression, 4), _defineProperty(_AST$PRECEDENCE, AST.MemberExpression, 5), _defineProperty(_AST$PRECEDENCE, AST.Identifier, 6), _defineProperty(_AST$PRECEDENCE, AST.Literal, 6), _defineProperty(_AST$PRECEDENCE, AST.ObjectExpression, 6), _defineProperty(_AST$PRECEDENCE, AST.Property, 6), _defineProperty(_AST$PRECEDENCE, AST.ArrayExpression, 6), _AST$PRECEDENCE);

  AST.LOGICAL_EXPRESSION_PRECEDENCE = {
    '||': 1,
    '&&': 2
  };

  AST.BINARY_EXPRESSION_PRECEDENCE = {
    '==': 1,
    '!=': 1,
    '<': 2,
    '<=': 2,
    '>': 2,
    '>=': 2,
    '+': 3,
    '-': 3,
    '*': 4,
    '/': 4,
    '%': 4
  };

  exports.AST = AST;

  var parser__DEFAULT_OPTIONS = {
    LexerClass: Lexer,
    ASTBuilderClass: AST
  };

  var Parser = (function () {
    function Parser(options) {
      _classCallCheck(this, Parser);

      this.options = defaults(options, parser__DEFAULT_OPTIONS);
      var lexer = new this.options.LexerClass();
      this.astBuilder = new this.options.ASTBuilderClass(lexer);
    }

    _createClass(Parser, [{
      key: 'precedence',
      value: function precedence(expr1, expr2) {
        var prec = AST.PRECEDENCE;
        if (prec[expr1.type] < prec[expr2.type]) {
          return -1;
        } else if (prec[expr1.type] > prec[expr2.type]) {
          return +1;
        } else if (expr1.type === AST.LogicalExpression || expr1.type === AST.BinaryExpression) {
          var oprec = expr1.type === AST.LogicalExpression ? AST.LOGICAL_EXPRESSION_PRECEDENCE : AST.BINARY_EXPRESSION_PRECEDENCE;
          if (oprec[expr1.operator] < oprec[expr2.operator]) {
            return -1;
          } else if (oprec[expr1.operator] > oprec[expr2.operator]) {
            return +1;
          }
        }
        return 0;
      }
    }, {
      key: 'toString',
      value: function toString(ast, parent) {
        var _this = this;

        var str = function str(expr) {
          return _this.toString(expr, ast);
        };
        if (parent && this.precedence(ast, parent) < 0) {
          return '(' + this.toString(ast) + ')';
        }
        switch (ast.type) {
          case AST.ConditionalExpression:
            return str(ast.test) + ' ? ' + str(ast.consequent) + ' : ' + str(ast.alternate);
          case AST.LogicalExpression:
            return str(ast.left) + ' ' + ast.operator + ' ' + str(ast.right);
          case AST.BinaryExpression:
            return str(ast.left) + ' ' + ast.operator + ' ' + str(ast.right);
          case AST.UnaryExpression:
            return '' + ast.operator + str(ast.argument);
          case AST.CallExpression:
            var args = ast.arguments.slice(1).map(function (arg) {
              return arg.type === AST.CallExpression ? ':(' + str(arg) + ')' : ':' + str(arg);
            }).join('');
            return str(ast.arguments[0]) + '|' + ast.callee.name + args;
          case AST.MemberExpression:
            if (!ast.computed && ast.property.type === AST.Identifier) {
              return str(ast.object) + '.' + ast.property.name;
            }
            return str(ast.object) + '[' + str(ast.property) + ']';
          case AST.Identifier:
            return ast.name;
          case AST.Literal:
            return ast.value === undefined ? 'undefined' : JSON.stringify(ast.value);
          case AST.ArrayExpression:
            return '[' + ast.elements.map(function (expr) {
              return _this.toString(expr);
            }).join(', ') + ']';
          case AST.ObjectExpression:
            var properties = ast.properties.map(function (expr) {
              if (expr.key.type === AST.Identifier || expr.key.type === AST.Literal) {
                return _this.toString(expr.key) + ': ' + _this.toString(expr.value);
              } else {
                _this.throwError('IMPOSSIBLE');
              }
            });
            return '{' + properties.join(', ') + '}';
        }
      }
    }, {
      key: 'eval',
      value: function _eval(ast) {
        var _this2 = this;

        var locals = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var filters = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

        var e = function e(expr) {
          return _this2.eval(expr, locals, filters);
        };
        try {
          switch (ast.type) {
            case AST.ConditionalExpression:
              return e(ast.test) ? e(ast.consequent) : e(ast.alternate);
            case AST.LogicalExpression:
              switch (ast.operator) {
                case '&&':
                  return e(ast.left) && e(ast.right);
                case '||':
                  return e(ast.left) || e(ast.right);
                default:
                  this.throwError('IMPOSSIBLE');
              }
              break;
            case AST.BinaryExpression:
              var left = e(ast.left);
              var right = e(ast.right);
              switch (ast.operator) {
                case '==':
                  return left === right;
                case '!=':
                  return left !== right;
                case '<':
                  return left < right;
                case '<=':
                  return left <= right;
                case '>':
                  return left > right;
                case '>=':
                  return left >= right;
                case '+':
                  return left + right;
                case '-':
                  return left - right;
                case '*':
                  return left * right;
                case '/':
                  return left / right;
                case '%':
                  return left % right;
                default:
                  this.throwError('IMPOSSIBLE');
              }
              break;
            case AST.UnaryExpression:
              switch (ast.operator) {
                case '+':
                  return +e(ast.argument);
                case '-':
                  return -e(ast.argument);
                case '!':
                  return !e(ast.argument);
                default:
                  this.throwError('IMPOSSIBLE');
              }
              break;
            case AST.CallExpression:
              if (ast.callee.type !== AST.Identifier) {
                this.throwError('IMPOSSIBLE');
              }
              if (!(ast.callee.name in filters)) {
                this.throwError('Reference error: [' + ast.callee.name + '] is not a defined filter');
              }
              var callee = filters[ast.callee.name];
              var args = ast.arguments.map(e);
              return callee.apply(null, args);
            case AST.MemberExpression:
              if (ast.property.type === AST.Identifier && !ast.computed) {
                return e(ast.object)[ast.property.name];
              }
              return e(ast.object)[e(ast.property)];
            case AST.Identifier:
              if (!(ast.name in locals)) {
                this.throwError('Reference error: [' + ast.name + '] is not a defined variable');
              }
              return locals[ast.name];
            case AST.Literal:
              return ast.value;
            case AST.ArrayExpression:
              return ast.elements.map(e);
            case AST.ObjectExpression:
              var res = {};
              ast.properties.forEach(function (prop) {
                if (prop.key.type === AST.Identifier) {
                  res[prop.key.name] = e(prop.value);
                } else {
                  res[e(prop.key)] = e(prop.value);
                }
              });
              return res;
          }
        } catch (err) {
          if (err.bubble) {
            throw err;
          }
          var info = err.message || 'No info available';
          this.throwError('There was an error evaluating `' + this.toString(ast) + '` (' + info + ')', true);
        }
      }
    }, {
      key: 'throwError',
      value: function throwError(msg) {
        var bubble = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        var err = Error('Parse Error: ' + msg);
        err.bubble = bubble;
        throw err;
      }
    }, {
      key: 'parse',
      value: function parse(text) {
        var _this3 = this;

        var ast = this.astBuilder.ast(text);
        return function () {
          var locals = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
          var filters = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
          return _this3.eval(ast, locals, filters);
        };
      }
    }]);

    return Parser;
  })();

  exports.Parser = Parser;

  'use strict';
});
//# sourceMappingURL=./expression-parser.js.map