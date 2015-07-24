import {defaults} from './helpers';
import AST from './ast';

export const DEFAULT_OPTIONS = {};

export default class Parser {
  constructor(astBuilder, options) {
    this.astBuilder = astBuilder;
    this.options = defaults(options, DEFAULT_OPTIONS);
  }

  toString(ast, parent) {
    let str = expr => this.toString(expr, ast);
    if (parent && AST.PRIORITY[ast.type] <= AST.PRIORITY[parent.type] && AST.PRIORITY[parent.type] > 0) {
      return `(${this.toString(ast)})`;
    }
    switch (ast.type) {
      case AST.Program:
        return ast.body.map(str).join(';\n');
      case AST.ExpressionStatement:
        return this.toString(ast.expression);
      case AST.ConditionalExpression:
        return `${str(ast.test)} ? ${str(ast.consequent)} : ${str(ast.alternate)}`;
      case AST.LogicalExpression:
        return `${str(ast.left)} ${ast.operator} ${str(ast.right)}`;
      case AST.BinaryExpression:
        return `${str(ast.left)} ${ast.operator} ${str(ast.right)}`;
      case AST.UnaryExpression:
        return `${ast.operator}${str(ast.argument)}`;
      case AST.CallExpression:
        let args = ast.arguments.length > 1 ? ast.arguments.slice(1).map(arg => `:${str(arg)}`).join() : '';
        return `${str(ast.arguments[0])}|${ast.callee.name}${args}`;
      case AST.MemberExpression:
        if (!ast.computed && ast.property.type === AST.Identifier) {
          return `${str(ast.object)}.${ast.property.name}`;
        }
        return `${str(ast.object)}[${this.toString(ast.property)}]`;
      case AST.Identifier:
        return ast.name;
      case AST.Literal:
        return ast.value === undefined ? 'undefined' : JSON.stringify(ast.value);
      case AST.ArrayExpression:
        return `[${ast.elements.map(expr => this.toString(expr)).join(', ')}]`;
      case AST.ObjectExpression:
        let properties = ast.properties.map(expr => {
          if (expr.key.type === AST.Identifier || expr.key.type === AST.Literal) {
            return `${this.toString(expr.key)}: ${this.toString(expr.value)}`;
          } else {
            this.throwError('IMPOSSIBLE');
          }
        });
        return `{${properties.join(', ')}}`;
    }
  }

  eval(ast, locals = {}, filters = {}) {
    let e = expr => this.eval(expr, locals, filters);
    try {
      switch (ast.type) {
        case AST.Program:
          let result;
          for (let expr of ast.body) {
            result = e(expr);
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
              this.throwError('IMPOSSIBLE');
          }
          break;
        case AST.BinaryExpression:
          let left = e(ast.left);
          let right = e(ast.right);
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
            this.throwError(`Reference error: [${ast.callee.name}] is not a defined filter`);
          }
          let callee = filters[ast.callee.name];
          let args = ast.arguments.map(e);
          return callee.apply(null, args);
        case AST.MemberExpression:
          if (ast.property.type === AST.Identifier && !ast.computed) {
            return e(ast.object)[ast.property.name];
          }
          return e(ast.object)[e(ast.property)];
        case AST.Identifier:
          if (!(ast.name in locals)) {
            this.throwError(`Reference error: [${ast.name}] is not a defined variable`);
          }
          return locals[ast.name];
        case AST.Literal:
          return ast.value;
        case AST.ArrayExpression:
          return ast.elements.map(e);
        case AST.ObjectExpression:
          let res = {};
          ast.properties.forEach(prop => {
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
      let info = (err.message || 'No info available');
      this.throwError(`There was an error evaluating \`${this.toString(ast)}\` (${info})`, true);
    }
  }

  throwError(msg, bubble = false) {
    let err = Error(`Parse Error: ${msg}`);
    err.bubble = bubble;
    throw err;
  }

  parse(text) {
    let ast = this.astBuilder.ast(text);
    return (locals = {}, filters = {}) => this.eval(ast, locals, filters);
  }
}
