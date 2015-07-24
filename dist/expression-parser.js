var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('defaults')) : typeof define === 'function' && define.amd ? define(['exports', 'defaults'], factory) : factory(global.MyLibrary = {}, global.defaults);
})(this, function (exports, defaults) {
  'use strict';

  defaults = 'default' in defaults ? defaults['default'] : defaults;

  var OPERATORS = {
    '+': true,
    '-': true,
    '*': true,
    '/': true,
    '%': true,
    '===': true,
    '!==': true,
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

  var DEFAULT_OPTIONS = {
    allowAssignments: true,
    multipleExpressions: true
  };

  var AST = (function () {
    function AST(lexer, options) {
      _classCallCheck(this, AST);

      this.lexer = lexer;
      this.options = defaults(options, DEFAULT_OPTIONS);
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

        var value = this.options.multipleExpressions ? this.program() : this.expressionStatement();

        if (this.tokens.length !== 0) {
          this.throwError('is an unexpected token', this.tokens[0]);
        }

        return value;
      }
    }, {
      key: 'program',
      value: function program() {
        var body = [];
        while (true) {
          if (this.tokens.length > 0 && !this.peek('}', ')', ';', ']')) {
            body.push(this.expressionStatement());
          }
          if (!this.expect(';')) {
            return { type: AST.Program, body: body };
          }
        }
      }
    }, {
      key: 'expressionStatement',
      value: function expressionStatement() {
        return { type: AST.ExpressionStatement, expression: this.filterChain() };
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
        return this.assignment();
      }
    }, {
      key: 'assignment',
      value: function assignment() {
        var result = this.ternary();
        if (this.options.allowAssignments && this.expect('=')) {
          result = { type: AST.AssignmentExpression, left: result, right: this.assignment(), operator: '=' };
        }
        return result;
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
        while (token = this.expect('==', '!=', '===', '!==')) {
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
          if (next.text === '(') {
            primary = { type: AST.CallExpression, callee: primary, arguments: this.parseArguments() };
            this.consume(')');
          } else if (next.text === '[') {
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
      key: 'parseArguments',
      value: function parseArguments() {
        var args = [];
        if (this.peekToken().text !== ')') {
          do {
            args.push(this.expression());
          } while (this.expect(','));
        }
        return args;
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
              // Support trailing commas per ES5.1.
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
              // Support trailing commas per ES5.1.
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

  AST.Program = 'Program';
  AST.ExpressionStatement = 'ExpressionStatement';
  AST.AssignmentExpression = 'AssignmentExpression';
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

  exports.AST = AST;

  function isAssignable(_x) {
    var _again = true;

    _function: while (_again) {
      var ast = _x;
      _again = false;

      if (ast.type === AST.Identifier) {
        return true;
      } else if (ast.type === AST.MemberExpression) {
        _x = ast.object;
        _again = true;
        continue _function;
      } else {
        return false;
      }
    }
  }

  var Parser = (function () {
    function Parser(astBuilder, options) {
      _classCallCheck(this, Parser);

      this.astBuilder = astBuilder;
    }

    _createClass(Parser, [{
      key: 'eval',
      value: function _eval(ast, locals) {
        var _this = this;

        var e = function e(expr) {
          return _this.eval(expr, locals);
        };
        switch (ast.type) {
          case AST.Program:
            var result = undefined;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = ast.body[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var expr = _step.value;

                result = e(expr);
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                  _iterator['return']();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }

            return result;
          case AST.ExpressionStatement:
            return e(ast.expression);
          case AST.ConditionalExpression:
            return e(ast.test) ? e(ast.consequent) : e(ast.alternate);
          case AST.LogicalExpression:
            switch (ast.operator) {
              case '&&':
                return e(ast.left) && e(ast.right);
              case '||':
                return e(ast.left) || e(ast.right);
              default:
                throw Error();
            }
            break;
          case AST.BinaryExpression:
            var left = e(ast.left);
            var right = e(ast.right);
            switch (ast.operator) {
              case '==':
              case '===':
                return left === right;
              case '!=':
              case '!==':
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
                throw Error();
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
                throw Error();
            }
            break;
          case AST.CallExpression:
            var callee = e(ast.callee);
            var args = ast.arguments.map(e);
            return callee.apply(null, args);
          case AST.MemberExpression:
            if (ast.property.type === AST.Identifier && !ast.computed) {
              return e(ast.object)[ast.property.name];
            }
            return e(ast.object)[e(ast.property)];
          case AST.Identifier:
            if (!(ast.name in locals)) {
              throw Error('Reference error: ' + ast.name + ' is not defined');
            }
            return locals[ast.name];
          case AST.Literal:
            return ast.value;
          case AST.ArrayExpression:
            return ast.elements.map(e);
          case AST.ObjectExpression:
            var res = {};
            ast.properties.forEach(function (prop) {
              res[e(prop.key)] = e(prop.value);
            });
            return res;
          case AST.AssignmentExpression:
            if (!isAssignable(ast.left)) {
              throw Error('Trying to assign a value to a non l-value');
            }
            locals[e(ast.left)] = e(ast.right);
            return undefined;
        }
      }
    }, {
      key: 'parse',
      value: function parse(text) {
        var _this2 = this;

        var ast = this.astBuilder.ast(text);
        return function (locals) {
          return _this2.eval(ast, locals);
        };
      }
    }]);

    return Parser;
  })();

  exports.Parser = Parser;

  'use strict';
});
//# sourceMappingURL=./expression-parser.js.map