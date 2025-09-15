import { assertEquals } from "@std/assert/equals";
import { assertStrictEquals } from "@std/assert/strict-equals";
import { assertThrows } from "@std/assert/throws";
import { assertStringIncludes } from "@std/assert/string-includes";

const suiteStack = [];

// shim the test framework API expected by this file to use Deno.test
export function describe(label, func) {
  suiteStack.push(label);
  func();
  suiteStack.pop();
}

export function it(label, func) {
  Deno.test([...suiteStack, label].join(' / '), func);
}

export function expect(actual) {
  return {
    toMatchObject(expected) { assertEquals(actual, expected) },
    toEqual(expected) { assertEquals(actual, expected) },
    toBe(expected) { assertEquals(actual, expected) },
    toStrictEqual(expected) { assertStrictEquals(actual, expected) },
    toThrow(message) { assertThrows(actual, Error, message) },
    toContain(slice) { assertStringIncludes(actual, slice) },
    not: {
      toThrow() { actual() }, // the test fails if anything throws anyway...
    },
  };
}

export function each(cases, labelFunc, testFunc) {
  for (const testCase of cases) {
    it(labelFunc(testCase), () => testFunc(testCase));
  }
}
