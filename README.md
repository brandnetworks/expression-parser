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
- Locals variable reassignment

Examples
--------
```js

import {Lexer, AST, Parser} from 'expression-parser';
let ast = new AST(new Lexer());
let parser = new Parser(ast);
let $eval = parser.parse('name|replace:"Mr":"Mrs"');
$eval({name: 'Mr. Asimov'})
// > 'Mrs. Asimov'
let $eval = parser.parse('1 + 2 + 8/4');
$eval()
// > 5
```

For more examples check the tests.


