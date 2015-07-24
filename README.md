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
var Parser = require('expression-parser');
var parser = new Parser();
var $eval = parser.parse('name|replace:"Mr":"Mrs"');
$eval({name: 'Mr. Asimov'}, {
  replace: function(text, substr, repl) { return text.replace(substr, repl); }
});
// > 'Mrs. Asimov'
var $eval = parser.parse('1 + 2 + 8/4');
$eval();
// > 5
```

```js
// On the browser
var parser = new ExpressionParser.Parser();
var $eval = parser.parse('name|replace:"Mr":"Mrs"');
$eval({name: 'Mr. Asimov'}, {
  replace: function(text, substr, repl) { return text.replace(substr, repl); }
});
// > 'Mrs. Asimov'
var $eval = parser.parse('1 + 2 + 8/4');
$eval();
// > 5
```
For more examples check the tests.


