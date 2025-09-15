# jmespath

This is a TypeScript implementation of the [JMESPath](https://jmespath.org) spec,
ported to the Deno runtime.
The original TypeScript implementation comes from
[nanoporetech/jmespath-ts](https://github.com/nanoporetech/jmespath-ts).

JMESPath is a query language for JSON. It will take a JSON document
as input and transform it into another JSON document
given a JMESPath expression.

## USAGE

### `search(data: JSONValue, expression: string): JSONValue`

```javascript
import { search } from "jsr:@cloudydeno/jmespath";

search({foo: {bar: {baz: [0, 1, 2, 3, 4]}}}, "foo.bar.baz[2]")

// OUTPUTS: 2

```

In the example we gave the `search` function input data of
`{foo: {bar: {baz: [0, 1, 2, 3, 4]}}}` as well as the JMESPath
expression `foo.bar.baz[2]`, and the `search` function evaluated
the expression against the input data to produce the result `2`.

The JMESPath language can do *a lot* more than select an element
from a list.  Here are a few more examples:

```javascript
import { search } from "jsr:@cloudydeno/jmespath";

/* --- EXAMPLE 1 --- */

let JSON_DOCUMENT = {
  foo: {
    bar: {
      baz: [0, 1, 2, 3, 4]
    }
  }
};

search(JSON_DOCUMENT, "foo.bar");
// OUTPUTS: { baz: [ 0, 1, 2, 3, 4 ] }


/* --- EXAMPLE 2 --- */

JSON_DOCUMENT = {
  "foo": [
    {"first": "a", "last": "b"},
    {"first": "c", "last": "d"}
  ]
};

search(JSON_DOCUMENT, "foo[*].first")
// OUTPUTS: [ 'a', 'c' ]


/* --- EXAMPLE 3 --- */

JSON_DOCUMENT = {
  "foo": [
    {"age": 20},
    {"age": 25},
    {"age": 30},
    {"age": 35},
    {"age": 40}
  ]
}

search(JSON_DOCUMENT, "foo[?age > `30`]");
// OUTPUTS: [ { age: 35 }, { age: 40 } ]
```


### `registerFunction(functionName: string, customFunction: RuntimeFunction, signature: InputSignature[]): void`

Extend the list of built in JMESpath expressions with your own functions.

```javascript
  import {search, registerFunction, TYPE_NUMBER} from "jsr:@cloudydeno/jmespath";


  search({ foo: 60, bar: 10 }, 'divide(foo, bar)')
  // THROWS ERROR: Error: Unknown function: divide()

  registerFunction(
    'divide', // FUNCTION NAME
    (resolvedArgs) => {   // CUSTOM FUNCTION
      const [dividend, divisor] = resolvedArgs;
      return dividend / divisor;
    },
    [{ types: [TYPE_NUMBER] }, { types: [TYPE_NUMBER] }] //SIGNATURE
  );

  search({ foo: 60,bar: 10 }, 'divide(foo, bar)');
  // OUTPUTS: 6

```

### `compile(expression: string): ASTNode`

You can precompile all your expressions ready for use later on. the `compile`
function takes a JMESPath expression and returns an abstract syntax tree that
can be used by the TreeInterpreter function

```javascript
import { compile, TreeInterpreter } from "jsr:@cloudydeno/jmespath";

const ast = compile('foo.bar');

TreeInterpreter.search(ast, {foo: {bar: 'BAZ'}})
// RETURNS: "BAZ"

```


## More Resources

The example above only show a small amount of what
a JMESPath expression can do. If you want to take a
tour of the language, the *best* place to go is the
[JMESPath Tutorial](http://jmespath.org/tutorial.html).

One of the best things about JMESPath is that it is
implemented in many different programming languages including
python, ruby, php, lua, etc.  To see a complete list of libraries,
check out the [JMESPath libraries page](http://jmespath.org/libraries.html).

And finally, the full JMESPath specification can be found
on the [JMESPath site](http://jmespath.org/specification.html).


## License

jmespath-ts is licensed under the Mozilla Public License Version 2.0
