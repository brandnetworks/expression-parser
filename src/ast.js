import {copy, defaults} from './helpers';

export const DEFAULT_OPTIONS = {
  multipleExpressions: true
};

export default class AST {

  constructor(lexer, options) {
    this.lexer = lexer;
    this.options = defaults(options, DEFAULT_OPTIONS);
    this.constants = {
      'true': { type: AST.Literal, value: true },
      'false': { type: AST.Literal, value: false },
      'null': { type: AST.Literal, value: null },
      'undefined': { type: AST.Literal, value: undefined }
    };
  }

  ast(text) {
    this.text = text;
    this.tokens = this.lexer.lex(text);

    let value = this.options.multipleExpressions ? this.program() : this.expressionStatement();

    if (this.tokens.length !== 0) {
      this.throwError('is an unexpected token', this.tokens[0]);
    }

    return value;
  }

  program() {
    let body = [];
    while (true) {
      if (this.tokens.length > 0 && !this.peek('}', ')', ';', ']')) {
        body.push(this.expressionStatement());
      }
      if (!this.expect(';')) {
        return { type: AST.Program, body: body };
      }
    }
  }

  expressionStatement() {
    return { type: AST.ExpressionStatement, expression: this.filterChain() };
  }

  filterChain() {
    let left = this.expression();
    let token;
    while ((token = this.expect('|'))) {
      left = this.filter(left);
    }
    return left;
  }

  expression() {
    return this.ternary();
  }

  ternary() {
    let test = this.logicalOR();
    let alternate;
    let consequent;
    if (this.expect('?')) {
      consequent = this.expression();
      if (this.consume(':')) {
        alternate = this.expression();
        return { type: AST.ConditionalExpression, test: test, consequent: consequent, alternate: alternate };
      }
    }
    return test;
  }

  logicalOR() {
    let left = this.logicalAND();
    while (this.expect('||')) {
      left = { type: AST.LogicalExpression, operator: '||', left: left, right: this.logicalAND() };
    }
    return left;
  }

  logicalAND() {
    let left = this.equality();
    while (this.expect('&&')) {
      left = { type: AST.LogicalExpression, operator: '&&', left: left, right: this.equality() };
    }
    return left;
  }

  equality() {
    let left = this.relational();
    let token;
    while ((token = this.expect('==', '!='))) {
      left = { type: AST.BinaryExpression, operator: token.text, left: left, right: this.relational() };
    }
    return left;
  }

  relational() {
    let left = this.additive();
    let token;
    while ((token = this.expect('<', '>', '<=', '>='))) {
      left = { type: AST.BinaryExpression, operator: token.text, left: left, right: this.additive() };
    }
    return left;
  }

  additive() {
    let left = this.multiplicative();
    let token;
    while ((token = this.expect('+', '-'))) {
      left = { type: AST.BinaryExpression, operator: token.text, left: left, right: this.multiplicative() };
    }
    return left;
  }

  multiplicative() {
    let left = this.unary();
    let token;
    while ((token = this.expect('*', '/', '%'))) {
      left = { type: AST.BinaryExpression, operator: token.text, left: left, right: this.unary() };
    }
    return left;
  }

  unary() {
    let token;
    if ((token = this.expect('+', '-', '!'))) {
      return { type: AST.UnaryExpression, operator: token.text, prefix: true, argument: this.unary() };
    } else {
      return this.primary();
    }
  }

  primary() {
    let primary;
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

    let next;
    while ((next = this.expect('(', '[', '.'))) {
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

  filter(baseExpression) {
    let args = [baseExpression];
    let result = { type: AST.CallExpression, callee: this.identifier(), arguments: args, filter: true };

    while (this.expect(':')) {
      args.push(this.expression());
    }

    return result;
  }

  identifier() {
    let token = this.consume();
    if (!token.identifier) {
      this.throwError('is not a valid identifier', token);
    }
    return { type: AST.Identifier, name: token.text };
  }

  constant() {
    // TODO check that it is a constant
    return { type: AST.Literal, value: this.consume().value };
  }

  arrayDeclaration() {
    let elements = [];
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

  object() {
    let properties = [], property;
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

  throwError(msg, token) {
    throw Error(`Syntax Error: Token \'${token.text}\' ${msg} at column ${token.index + 1} of the expression [${this.text}] starting at [${this.text.substring(token.index)}].`);
  }

  consume(e1) {
    if (this.tokens.length === 0) {
      throw Error(`Unexpected end of expression: ${this.text}`);
    }

    let token = this.expect(e1);
    if (!token) {
      this.throwError('is unexpected, expecting [' + e1 + ']', this.peek());
    }
    return token;
  }

  peekToken() {
    if (this.tokens.length === 0) {
      throw Error(`Unexpected end of expression: ${this.text}`);
    }
    return this.tokens[0];
  }

  peek(e1, e2, e3, e4) {
    return this.peekAhead(0, e1, e2, e3, e4);
  }

  peekAhead(i, e1, e2, e3, e4) {
    if (this.tokens.length > i) {
      let token = this.tokens[i];
      let t = token.text;
      if (t === e1 || t === e2 || t === e3 || t === e4 ||
        (!e1 && !e2 && !e3 && !e4)) {
        return token;
      }
    }
    return false;
  }

  expect(e1, e2, e3, e4) {
    let token = this.peek(e1, e2, e3, e4);
    if (token) {
      this.tokens.shift();
      return token;
    }
    return false;
  }
}

AST.Program = 'Program';
AST.ExpressionStatement = 'ExpressionStatement';
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
