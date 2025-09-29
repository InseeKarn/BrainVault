const SAFE_ID = /[A-Za-z_][A-Za-z0-9_]*/g;
const ALLOWED_CHARS = /^[0-9+\-*/().,^=\sA-Za-z_]+$/;
const TOL = 1e-6;

function toNumber(x) {
  const n = typeof x === 'number' ? x : Number(x);
  if (!isFinite(n)) throw new Error('Non-finite number');
  return n;
}

function approxEqual(a, b, tol = TOL) {
  const A = toNumber(a), B = toNumber(b);
  const diff = Math.abs(A - B);
  const scale = Math.max(1, Math.abs(A), Math.abs(B));
  return diff <= tol * scale;
}

function isConstantName(name) {
  return name === 'pi' || name === 'PI' || name === 'e' || name === 'E';
}

function normalizeFormula(formula = '') {
  return String(formula).replace(/\s+/g, ' ').trim();
}

function validateFormulaStructure(formula) {
  const f = normalizeFormula(formula);
  if (!f) return { ok: false, error: 'Empty formula' };
  if (!ALLOWED_CHARS.test(f)) return { ok: false, error: 'Formula contains invalid characters' };
  // Basic parentheses check
  let bal = 0;
  for (const ch of f) {
    if (ch === '(') bal++;
    else if (ch === ')') bal--;
    if (bal < 0) return { ok: false, error: 'Mismatched parentheses' };
  }
  if (bal !== 0) return { ok: false, error: 'Unbalanced parentheses' };
  return { ok: true };
}

function extractIdentifiers(expr) {
  const set = new Set();
  const ids = expr.match(SAFE_ID) || [];
  for (const id of ids) set.add(id);
  return Array.from(set);
}

function validateVariables(variables = {}, given = {}) {
  const issues = [];
  // ensure variables are numeric
  for (const [k, v] of Object.entries(variables)) {
    if (!/^[_A-Za-z][_A-Za-z0-9]*$/.test(k)) {
      issues.push({ type: 'variable_name_invalid', message: `Invalid variable name: ${k}` });
      continue;
    }
    if (v === null || v === undefined || !isFinite(Number(v))) {
      issues.push({ type: 'variable_not_numeric', message: `Variable ${k} must be numeric` });
    }
  }
  // compare against given when present
  for (const [k, gv] of Object.entries(given)) {
    if (k in variables) {
      const vv = Number(variables[k]);
      const gg = Number(gv);
      if (!approxEqual(vv, gg)) {
        issues.push({ type: 'wrong_variable_value', message: `Variable ${k} should be ${gg} but is ${vv}` });
      }
    }
  }
  return { ok: issues.length === 0, issues };
}

function substituteVariables(expr, variables = {}) {
  // Replace ^ with ** for JS exponentiation
  let e = expr.replace(/\^/g, '**');
  // Map known math functions to Math.*
  e = e.replace(/\bsqrt\s*\(/g, 'Math.sqrt(')
       .replace(/\bsin\s*\(/g, 'Math.sin(')
       .replace(/\bcos\s*\(/g, 'Math.cos(')
       .replace(/\btan\s*\(/g, 'Math.tan(')
       .replace(/\basin\s*\(/g, 'Math.asin(')
       .replace(/\bacos\s*\(/g, 'Math.acos(')
       .replace(/\batan\s*\(/g, 'Math.atan(');
  // Replace identifiers by their numeric value if present in variables
  e = e.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g, (m, name) => {
    if (name in variables) {
      const v = Number(variables[name]);
      if (!isFinite(v)) throw new Error(`Variable ${name} is not finite`);
      return `(${v})`;
    }
    // constants
    if (name === 'pi' || name === 'PI') return `(${Math.PI})`;
    if (name === 'e' || name === 'E') return `(${Math.E})`;
    return name; // allow Math.* tokens to remain
  });
  // Validate whitelist: after removing allowed tokens, no letters should remain
  const stripped = e
    .replace(/Math\.(sqrt|sin|cos|tan|asin|acos|atan)/g, '')
    .replace(/[0-9+\-*/().,\s*]/g, '');
  if (/[^]/.test(stripped) && stripped.trim().length > 0) {
    throw new Error('Expression contains unknown identifiers');
  }
  return e;
}

function safeEval(expr) {
  // Whitelist check: only digits, ops, parentheses, commas, spaces, and Math.* functions
  const tmp = expr
    .replace(/Math\.(sqrt|sin|cos|tan|asin|acos|atan)/g, '')
    .replace(/[0-9+\-*/().,\s*]/g, '');
  if (tmp.trim().length > 0) {
    throw new Error('Unsafe expression');
  }
  // eslint-disable-next-line no-new-func
  const fn = new Function(`return (${expr});`);
  const val = fn();
  if (!isFinite(val)) throw new Error('Non-finite evaluation result');
  return Number(val);
}

function evaluateExpression(expr, variables = {}) {
  const sub = substituteVariables(expr, variables);
  return safeEval(sub);
}

function verifyCalculation(step = {}, given = {}) {
  const issues = [];
  const { formula, variables = {}, result } = step;
  const fs = validateFormulaStructure(formula);
  if (!fs.ok) issues.push({ type: 'formula_structure', message: fs.error });

  const vv = validateVariables(variables, given);
  issues.push(...vv.issues);

  let lhsVal = null, rhsVal = null, exprVal = null;
  const f = normalizeFormula(formula);
  try {
    if (f.includes('=')) {
      const [lhs, rhs] = f.split('=').map(s => s.trim());
      const idsL = extractIdentifiers(lhs);
      const idsR = extractIdentifiers(rhs);
      const provided = new Set(Object.keys(variables || {}));
      const unknownL = idsL.filter(n => !provided.has(n) && !isConstantName(n));
      const unknownR = idsR.filter(n => !provided.has(n) && !isConstantName(n));
      const totalUnknowns = Array.from(new Set([...unknownL, ...unknownR]));

      // Case A: no unknowns -> evaluate both sides normally
      if (totalUnknowns.length === 0) {
        lhsVal = evaluateExpression(lhs, variables);
        rhsVal = evaluateExpression(rhs, variables);
        if (!approxEqual(lhsVal, rhsVal)) {
          issues.push({ type: 'equation_not_balanced', message: `Left (${lhsVal}) not equal to Right (${rhsVal})` });
        }
        if (result !== undefined && result !== null) {
          const r = Number(result);
          if (!approxEqual(rhsVal, r) && !approxEqual(lhsVal, r)) {
            issues.push({ type: 'result_mismatch', message: `Provided result ${r} does not match evaluated value` });
          }
        }
      }
      // Case B: exactly one unknown, and the equation isolates it on one side
      else if (totalUnknowns.length === 1) {
        const unk = totalUnknowns[0];
        const lhsIsUnk = lhs === unk;
        const rhsIsUnk = rhs === unk;
        if (lhsIsUnk && unknownR.length === 0) {
          rhsVal = evaluateExpression(rhs, variables);
          if (result !== undefined && result !== null) {
            const r = Number(result);
            if (!approxEqual(rhsVal, r)) {
              issues.push({ type: 'result_mismatch', message: `Result for ${unk} should be ${rhsVal} but got ${r}` });
            }
          }
        } else if (rhsIsUnk && unknownL.length === 0) {
          lhsVal = evaluateExpression(lhs, variables);
          if (result !== undefined && result !== null) {
            const r = Number(result);
            if (!approxEqual(lhsVal, r)) {
              issues.push({ type: 'result_mismatch', message: `Result for ${unk} should be ${lhsVal} but got ${r}` });
            }
          }
        } else {
          // Unknown present but not solvable in this simple rule
          issues.push({ type: 'insufficient_variables', message: 'Provide all but one variable and isolate the unknown on one side (e.g., x = ...)' });
        }
      }
      // Case C: multiple unknowns -> cannot verify numerically
      else {
        issues.push({ type: 'insufficient_variables', message: 'Too many unknown variables to evaluate this step' });
      }
    } else {
      exprVal = evaluateExpression(f, variables);
      if (result !== undefined && result !== null) {
        const r = Number(result);
        if (!approxEqual(exprVal, r)) {
          issues.push({ type: 'result_mismatch', message: `Provided result ${r} does not match evaluated ${exprVal}` });
        }
      }
    }
  } catch (e) {
    issues.push({ type: 'evaluation_error', message: e.message });
  }

  return { ok: issues.length === 0, issues, values: { lhsVal, rhsVal, exprVal } };
}

function verifySolution(payload = {}, problem = {}) {
  const { steps = [], finalAnswer = null } = payload;
  const given = problem.given || {};
  const issues = [];
  const computed = [];

  if (!Array.isArray(steps) || steps.length === 0) {
    issues.push({ type: 'no_steps', message: 'Provide at least one calculation step' });
  }

  let lastVal = null;
  steps.forEach((step, idx) => {
    const res = verifyCalculation(step, given);
    computed.push(res.values);
    res.issues.forEach(x => issues.push({ ...x, stepIndex: idx }));
    const { exprVal, rhsVal, lhsVal } = res.values;
    const stepVal = (exprVal !== null && exprVal !== undefined) ? exprVal : (rhsVal !== null && rhsVal !== undefined ? rhsVal : lhsVal);
    lastVal = stepVal;
  });

  const expected = problem.answer && problem.answer.value;
  const finalCheck = { expected, got: null, ok: false };
  if (finalAnswer && (finalAnswer.value !== undefined && finalAnswer.value !== null)) {
    finalCheck.got = Number(finalAnswer.value);
  } else if (lastVal !== null) {
    finalCheck.got = Number(lastVal);
  }
  if (finalCheck.got !== null && finalCheck.got !== undefined && expected !== undefined) {
    finalCheck.ok = approxEqual(finalCheck.got, expected);
    if (!finalCheck.ok) issues.push({ type: 'final_answer_incorrect', message: `Expected ${expected} but got ${finalCheck.got}` });
  }

  // Cheating prevention (basic): ensure formula references at least one given variable
  const usedVars = new Set();
  for (const s of steps) {
    const ids = extractIdentifiers(String(s.formula || ''));
    ids.forEach(id => usedVars.add(id));
  }
  const givenKeys = Object.keys(given || {});
  if (givenKeys.length && !givenKeys.some(k => usedVars.has(k))) {
    issues.push({ type: 'cheating_suspected', message: 'No given variables referenced in steps' });
  }

  return { correct: issues.length === 0, issues, computed, finalCheck };
}

function getDetailedFeedback(payload = {}, problem = {}) {
  const { steps = [], finalAnswer = null } = payload;
  const given = problem.given || {};
  const messages = [];

  steps.forEach((step, idx) => {
    const res = verifyCalculation(step, given);
    if (res.issues.length === 0) {
      messages.push({ stepIndex: idx, status: 'ok', message: 'Step looks correct' });
    } else {
      for (const iss of res.issues) {
        messages.push({ stepIndex: idx, status: 'error', ...iss });
      }
    }
  });

  const expected = problem.answer && problem.answer.value;
  if (expected !== undefined) {
    const got = finalAnswer && finalAnswer.value !== undefined ? Number(finalAnswer.value) : null;
    if (got === null) {
      messages.push({ status: 'warning', type: 'no_final_answer', message: 'No final answer provided; using last step result' });
    } else if (!approxEqual(got, expected)) {
      messages.push({ status: 'error', type: 'final_answer_incorrect', message: `Final answer ${got} is not equal to expected ${expected}` });
    } else {
      messages.push({ status: 'ok', type: 'final_answer_correct', message: 'Final answer matches expected value' });
    }
  }

  return messages;
}

module.exports = {
  normalizeFormula,
  validateFormulaStructure,
  validateVariables,
  evaluateExpression,
  verifyCalculation,
  verifySolution,
  getDetailedFeedback,
  approxEqual,
};
