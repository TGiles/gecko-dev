/**
* AUTO-GENERATED - DO NOT EDIT. Source: https://github.com/gpuweb/cts
**/export const description = `
Execution Tests for the f32 comparison operations
`;import { makeTestGroup } from '../../../../../common/framework/test_group.js';
import { GPUTest } from '../../../../gpu_test.js';
import { anyOf } from '../../../../util/compare.js';
import { bool, f32, TypeBool, TypeF32 } from '../../../../util/conversion.js';
import { flushSubnormalNumberF32, vectorF32Range } from '../../../../util/math.js';
import { makeCaseCache } from '../case_cache.js';
import { allInputSources, run } from '../expression.js';

import { binary } from './binary.js';

export const g = makeTestGroup(GPUTest);

/**
 * @returns a test case for the provided left hand & right hand values and truth function.
 * Handles quantization and subnormals.
 */
function makeCase(
lhs,
rhs,
truthFunc)
{
  // Subnormal float values may be flushed at any time.
  // https://www.w3.org/TR/WGSL/#floating-point-evaluation
  const f32_lhs = f32(lhs);
  const f32_rhs = f32(rhs);
  const lhs_options = new Set([f32_lhs, f32(flushSubnormalNumberF32(lhs))]);
  const rhs_options = new Set([f32_rhs, f32(flushSubnormalNumberF32(rhs))]);
  const expected = [];
  lhs_options.forEach((l) => {
    rhs_options.forEach((r) => {
      const result = bool(truthFunc(l, r));
      if (!expected.includes(result)) {
        expected.push(result);
      }
    });
  });

  return { input: [f32_lhs, f32_rhs], expected: anyOf(...expected) };
}

export const d = makeCaseCache('binary/f32_logical', {
  equals_non_const: () => {
    const truthFunc = (lhs, rhs) => {
      return lhs.value === rhs.value;
    };

    return vectorF32Range(2).map((v) => {
      return makeCase(v[0], v[1], truthFunc);
    });
  },
  equals_const: () => {
    const truthFunc = (lhs, rhs) => {
      return lhs.value === rhs.value;
    };

    return vectorF32Range(2).map((v) => {
      return makeCase(v[0], v[1], truthFunc);
    });
  },
  not_equals_non_const: () => {
    const truthFunc = (lhs, rhs) => {
      return lhs.value !== rhs.value;
    };

    return vectorF32Range(2).map((v) => {
      return makeCase(v[0], v[1], truthFunc);
    });
  },
  not_equals_const: () => {
    const truthFunc = (lhs, rhs) => {
      return lhs.value !== rhs.value;
    };

    return vectorF32Range(2).map((v) => {
      return makeCase(v[0], v[1], truthFunc);
    });
  },
  less_than_non_const: () => {
    const truthFunc = (lhs, rhs) => {
      return lhs.value < rhs.value;
    };

    return vectorF32Range(2).map((v) => {
      return makeCase(v[0], v[1], truthFunc);
    });
  },
  less_than_const: () => {
    const truthFunc = (lhs, rhs) => {
      return lhs.value < rhs.value;
    };

    return vectorF32Range(2).map((v) => {
      return makeCase(v[0], v[1], truthFunc);
    });
  },
  less_equals_non_const: () => {
    const truthFunc = (lhs, rhs) => {
      return lhs.value <= rhs.value;
    };

    return vectorF32Range(2).map((v) => {
      return makeCase(v[0], v[1], truthFunc);
    });
  },
  less_equals_const: () => {
    const truthFunc = (lhs, rhs) => {
      return lhs.value <= rhs.value;
    };

    return vectorF32Range(2).map((v) => {
      return makeCase(v[0], v[1], truthFunc);
    });
  },
  greater_than_non_const: () => {
    const truthFunc = (lhs, rhs) => {
      return lhs.value > rhs.value;
    };

    return vectorF32Range(2).map((v) => {
      return makeCase(v[0], v[1], truthFunc);
    });
  },
  greater_than_const: () => {
    const truthFunc = (lhs, rhs) => {
      return lhs.value > rhs.value;
    };

    return vectorF32Range(2).map((v) => {
      return makeCase(v[0], v[1], truthFunc);
    });
  },
  greater_equals_non_const: () => {
    const truthFunc = (lhs, rhs) => {
      return lhs.value >= rhs.value;
    };

    return vectorF32Range(2).map((v) => {
      return makeCase(v[0], v[1], truthFunc);
    });
  },
  greater_equals_const: () => {
    const truthFunc = (lhs, rhs) => {
      return lhs.value >= rhs.value;
    };

    return vectorF32Range(2).map((v) => {
      return makeCase(v[0], v[1], truthFunc);
    });
  }
});

g.test('equals').
specURL('https://www.w3.org/TR/WGSL/#comparison-expr').
desc(
  `
Expression: x == y
Accuracy: Correct result
`
).
params((u) =>
u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4])
).
fn(async (t) => {
  const cases = await d.get(
    t.params.inputSource === 'const' ? 'equals_const' : 'equals_non_const'
  );
  await run(t, binary('=='), [TypeF32, TypeF32], TypeBool, t.params, cases);
});

g.test('not_equals').
specURL('https://www.w3.org/TR/WGSL/#comparison-expr').
desc(
  `
Expression: x != y
Accuracy: Correct result
`
).
params((u) =>
u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4])
).
fn(async (t) => {
  const cases = await d.get(
    t.params.inputSource === 'const' ? 'not_equals_const' : 'not_equals_non_const'
  );
  await run(t, binary('!='), [TypeF32, TypeF32], TypeBool, t.params, cases);
});

g.test('less_than').
specURL('https://www.w3.org/TR/WGSL/#comparison-expr').
desc(
  `
Expression: x < y
Accuracy: Correct result
`
).
params((u) =>
u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4])
).
fn(async (t) => {
  const cases = await d.get(
    t.params.inputSource === 'const' ? 'less_than_const' : 'less_than_non_const'
  );
  await run(t, binary('<'), [TypeF32, TypeF32], TypeBool, t.params, cases);
});

g.test('less_equals').
specURL('https://www.w3.org/TR/WGSL/#comparison-expr').
desc(
  `
Expression: x <= y
Accuracy: Correct result
`
).
params((u) =>
u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4])
).
fn(async (t) => {
  const cases = await d.get(
    t.params.inputSource === 'const' ? 'less_equals_const' : 'less_equals_non_const'
  );
  await run(t, binary('<='), [TypeF32, TypeF32], TypeBool, t.params, cases);
});

g.test('greater_than').
specURL('https://www.w3.org/TR/WGSL/#comparison-expr').
desc(
  `
Expression: x > y
Accuracy: Correct result
`
).
params((u) =>
u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4])
).
fn(async (t) => {
  const cases = await d.get(
    t.params.inputSource === 'const' ? 'greater_than_const' : 'greater_than_non_const'
  );
  await run(t, binary('>'), [TypeF32, TypeF32], TypeBool, t.params, cases);
});

g.test('greater_equals').
specURL('https://www.w3.org/TR/WGSL/#comparison-expr').
desc(
  `
Expression: x >= y
Accuracy: Correct result
`
).
params((u) =>
u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4])
).
fn(async (t) => {
  const cases = await d.get(
    t.params.inputSource === 'const' ? 'greater_equals_const' : 'greater_equals_non_const'
  );
  await run(t, binary('>='), [TypeF32, TypeF32], TypeBool, t.params, cases);
});