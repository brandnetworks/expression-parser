import {defaults} from './helpers';
import AST from './ast';

export const DEFAULT_OPTIONS = {
  allowUndefLocalAssignment: true,
};

export default class Parser {
  constructor(astBuilder, options) {
    this.astBuilder = astBuilder;
    this.options = defaults(options, DEFAULT_OPTIONS);
  }

  eval(ast, locals = {}) {
    let e = expr => this.eval(expr, locals);
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
        let callee = e(ast.callee);
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
          res[e(prop.key)] = e(prop.value);
        });
        return res;
      case AST.AssignmentExpression:
        if (!this.isAssignable(ast.left)) {
          this.throwError('Trying to assign a value to a non l-value');
        }
        this.assign(locals, ast.left, e(ast.right), locals);
        return undefined;
    }
  }

  isAssignable(ast) {
    if (ast.type === AST.Identifier) {
      return true;
    } else if (ast.type === AST.MemberExpression) {
      return this.isAssignable(ast.object);
    } else {
      return false;
    }
  }

  assign(into, ast, value, locals) {
    if (ast.type === AST.Identifier) {
      if (into === locals && !this.options.allowUndefLocalAssignment && !(ast.name in into)) {
        throw Error(`Reference Error: Can't assign to an undefined local variable [${ast.name}]`);
      }
      into[ast.name] = value;
    } else if (ast.type === AST.MemberExpression) {
      this.assign(this.eval(ast.object, locals), ast.property, value, locals);
    } else {
      if (into === locals) {
        this.throwError('IMPOSSIBLE');
      }
      into[this.eval(ast)] = value;
    }
  }

  throwError(msg) {
    throw Error(`Parse Error: ${msg}`);
  }

  parse(text) {
    let ast = this.astBuilder.ast(text);
    return locals => this.eval(ast, locals);
  }
}
