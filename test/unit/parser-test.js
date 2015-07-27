import util from 'util';
import {Parser} from '../../src';

describe('Default Parser', () => {
  let parser = new Parser();

  let tests = [{
    name: 'evals arithmetic',
    expression: 'a + b - c/(1 + 3 - 2) - 1',
    cases: [{
      locals: { a: 3, b: 7, c: 4 },
      result: 7
    }, {
      locals: { a: -1, b: -3, c: -8 },
      result: -1
    }],
  }, {
    name: 'evals filter evaluation',
    expression: 'name|replace : "Mr" : "Mrs"',
    cases: [{
      locals: { name: 'Mr. Albo' },
      filters: {
        replace: (text, subst, replacement) => text.replace(subst, replacement),
      },
      result: 'Mrs. Albo'
    }]
  }, {
    name: 'evals nesterd filter evaluation',
    expression: 'name|replace:("M"|append:"r"):"Mrs"',
    cases: [{
      locals: { name: 'Mr. Albo' },
      filters: {
        append: (a, b) => a + b,
        replace: (text, subst, replacement) => text.replace(subst, replacement),
      },
      result: 'Mrs. Albo'
    }]
  }, {
    name: 'multiple filters',
    expression: '""|append:1|append:2|append:3|append:4',
    cases: [{
      filters: {
        append: (a, b) => a + b,
      },
      result: '1234'
    }]
  }, {
    name: 'evals object members',
    expression: 'foo.bar + foo["baz"]',
    cases: [{
      locals: { foo: { bar: 1, baz: 3 } },
      result: 4
    }, {
      locals: { foo: { bar: -3, baz: 3 } },
      result: 0
    }]
  }, {
    name: 'evals array members',
    expression: 'foo[foo[foo[foo[0]]]]',
    cases: [{
      locals: { foo: [1, 2, 3, 4] },
      result: 4
    }]
  }, {
    name: 'evals array literals',
    expression: '[0, 1, 2, 3][1]',
    cases: [{
      result: 1
    }]
  }, {
    name: 'evals object literals',
    expression: '{a: "foo", "b": "bar"}["a"]',
    cases: [{
      result: 'foo'
    }]
  }, {
    name: 'accepts trailing semicolon',
    expression: '1 + 1;',
    cases: [{
      result: 2
    }]
  }, {
    name: 'accepts backtick identifiers',
    expression: '`hola que tal` + 2',
    cases: [{
      locals: {'hola que tal': 1},
      result: 3
    }]
  }, {
    name: 'accepts backtick identifiers as member expressions',
    expression: '{"hola que tal": 1}.`hola que tal`',
    cases: [{
      result: 1
    }]
  }];

  tests.forEach(test => {
    it(test.name, () => {
      let $eval = parser.parse(test.expression);
      test.cases.forEach(c => {
        expect($eval(c.locals, c.filters)).equals(c.result);
      });
    });
  });
});
