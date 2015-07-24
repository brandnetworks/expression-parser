Expression Parser
=================

This library is a tiny expresssion parser an evaluator for both Node.js and the browser.

It was originally extracted form the Angular.js expression parser so it supports Angular filter expressions such as:

```
name|replace:"Mr":"Mrs"
```

Features
--------

- Arithmethic and logical operators
- Ternary Operator
- Object and array literals
- Object and array member evaluation
- Function calls through filter expressions

Examples
--------
```js
// On Node.js
import {Lexer, AST, Parser} from 'expression-parser';
let ast = new AST(new Lexer());
let parser = new Parser(ast);
let $eval = parser.parse('name|replace:"Mr":"Mrs"');
$eval({name: 'Mr. Asimov'}, {
  replace: (text, substr, repl) => text.replace(substr, repl)
});
// > 'Mrs. Asimov'
let $eval = parser.parse('1 + 2 + 8/4');
$eval()
// > 5
```

```js
// On the browser
var ast = new ExpressionParser.AST(new ExpressionParser.Lexer());
var parser = new ExpressionParser.Parser(ast);
var $eval = parser.parse('name|replace:"Mr":"Mrs"');
$eval({name: 'Mr. Asimov'}, {
  replace: function(text, substr, repl) { return text.replace(substr, repl); }
});
// > 'Mrs. Asimov'
var $eval = parser.parse('1 + 2 + 8/4');
$eval()
// > 5
```
For more examples check the tests.


