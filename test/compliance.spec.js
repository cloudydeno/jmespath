/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-var-requires */
import { search } from '../src/index.ts';

import { basename } from '@std/path/basename';
import { join } from '@std/path/join';
import { describe, it, expect, each } from './deno-shim.js';

// Compliance tests that aren't supported yet.
const notImplementedYet = [];

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

const listing = Deno.readDirSync(join('test', 'compliance'));
for (const entry of listing) {
  const filename = join('test', 'compliance', entry.name);
  if (entry.isFile && endsWith(filename, '.json') && !notImplementedYet.includes(basename(filename))) {
    addTestSuitesFromFile(filename);
  }
}

/**
 *
 * @param {string} filename
 */
function addTestSuitesFromFile(filename) {
  describe(filename, () => {
    const spec = JSON.parse(Deno.readTextFileSync(filename));
    for (let i = 0; i < spec.length; i++) {
      const msg = `suite ${i}`;
      describe(msg, () => {
        const given = spec[i].given;

        each(spec[i].cases, titleFunc, ({expression, result, error}) => {
          if (error !== undefined) {
            expect(() => search(given, expression)).toThrow(error);
          } else {
            expect(search(given, expression)).toEqual(result);
          }
        });
      });
    }
  });
}

// wrapper to reduce code impact from rehighlighting
function titleFunc({comment}) {
  return `should pass case` + (comment ? ` '${comment}'` : '');
}
