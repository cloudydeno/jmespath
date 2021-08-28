import {
  assertEquals, assertStrictEquals,
  assertThrows, assertStringIncludes,
} from "https://deno.land/std@0.105.0/testing/asserts.ts";

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
