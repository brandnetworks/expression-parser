import util from 'util';
import {Lexer, AST, Parser} from '../../src';

describe('Default Parser', () => {
  let ast = new AST(new Lexer());
  let parser = new Parser(ast);

  let tests = [{
    name: 'evals arithmetic',
    expresssion: 'a + b - c/2',
    cases: [{
      locals: { a: 3, b: 7, c: 4 },
      result: 8
    }, {
      locals: { a: -1, b: -3, c: -8 },
      result: 0
    }],
  }, {
    name: 'evals filter evaluation',
    expresssion: 'name|replace : "Mr" : "Mrs"',
    cases: [{
      locals: { name: 'Mr. Albo' },
      filters: {
        replace: (text, subst, replacement) => text.replace(subst, replacement),
      },
      result: 'Mrs. Albo'
    }]
  }, {
    name: 'evals nesterd filter evaluation',
    expresssion: 'name|replace:("M"|append:"r"):"Mrs"',
    cases: [{
      locals: { name: 'Mr. Albo' },
      filters: {
        append: (a, b) => a + b,
        replace: (text, subst, replacement) => text.replace(subst, replacement),
      },
      result: 'Mrs. Albo'
    }]
  }, {
    name: 'evals object members',
    expresssion: 'foo.bar + foo["baz"]',
    cases: [{
      locals: { foo: { bar: 1, baz: 3 } },
      result: 4
    }, {
      locals: { foo: { bar: -3, baz: 3 } },
      result: 0
    }]
  }, {
    name: 'evals array members',
    expresssion: 'foo[foo[foo[foo[0]]]]',
    cases: [{
      locals: { foo: [1, 2, 3, 4] },
      result: 4
    }]
  }, {
    name: 'evals array literals',
    expresssion: '[0, 1, 2, 3][1]',
    cases: [{
      result: 1
    }]
  }, {
    name: 'evals object literals',
    expresssion: '{a: "foo", "b": "bar"}["a"]',
    cases: [{
      result: 'foo'
    }]
  }, {
    name: 'accepts trailing semicolon',
    expresssion: '1 + 1;',
    cases: [{
      result: 2
    }]
  }];

  tests.forEach(test => {
    it(test.name, () => {
      let $eval = parser.parse(test.expresssion);
      test.cases.forEach(c => {
        expect($eval(c.locals, c.filters)).equals(c.result);
      });
    });
  });
});
