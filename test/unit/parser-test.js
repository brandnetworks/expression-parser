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


describe('Parser with local assignment', () => {
  let ast = new AST(new Lexer(), {
    allowAssignments: true
  });
  let parser = new Parser(ast);

  it('assigns value to local variable', () => {
    let locals = {};
    let $eval = parser.parse('a = 3');
    $eval(locals);
    expect(locals.a).equals(3);
  });

  it('assigns value to local variable member', () => {
    let locals = {a: {b: 0}};
    let $eval = parser.parse('a.b = 3');
    $eval(locals);
    expect(locals.a.b).equals(3);
  });

  it('assigns value to local variable member as an expression', () => {
    let locals = {a: {foo: 0}};
    let $eval = parser.parse('a["f" + "oo"] = 3');
    $eval(locals);
    expect(locals.a.foo).equals(3);
  });
});
