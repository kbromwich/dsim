import parseRanges from 'util/parseRanges';
import Expression from './expressions/Expression';
import ExpressionCreator from './expressions/ExpressionCreator';
import { SplitExpressions } from './expressions/splitOperatorExpressions';
import { UnaryExpressions } from './expressions/unaryOperatorExpressions';
import { ValueExpressions } from './expressions/valueExpressions';
import SimState from './SimState';
import Simulation from './Simulation';
import { arrayBinned } from 'util/arrays';
import { stripComments, stripCommentsFromLines } from 'util/stripComments';
import stripError from 'util/stripError';
import { LineError, ParsedSims } from './ParsedSims';

const OperatorExpressions = [...SplitExpressions, ...UnaryExpressions];
const SimDefinitionRegex = /[^:#@]+@[- \t,\d]+:(.*)/;

function matchAt(matches: RegExpMatchArray[], index: number): RegExpExecArray | null {
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].index === index) {
      return matches[i] as RegExpExecArray;
    }
  }
  return null;
}

function appendChunk(result: string[], chunk: string, resets: number) {
  if (resets === 1 && chunk.startsWith('(') && chunk.endsWith(')')) {
    chunk = chunk.substring(1, chunk.length - 1);
  }
  result.push(chunk);
}

function splitExpr(
  expr: string, operator: ExpressionCreator<any>,
): [string[], RegExpExecArray | null, number] {
  const matches = [...expr.matchAll(operator.globalRegex)];
  if (!matches.length) {
    return [[], null, 0];
  }

  const result: string[] = [];
  let braces = 0;
  let currentChunk = '';
  let chunkParensResets = 0;
  let opMatch: RegExpExecArray | null = null;
  let i = 0;
  while (i < expr.length) {
    const curChar = expr[i];
    if (curChar === '(') {
      braces += 1;
    } else if (curChar === ')') {
      braces -= 1;
      if (braces === 0) {
        chunkParensResets += 1;
      }
    }
    if (braces === 0 && !opMatch && (operator.numOperands !== 2 || i > 0)) {
      opMatch = matchAt(matches, i);
      if (opMatch) {
        appendChunk(result, currentChunk, chunkParensResets);
        currentChunk = '';
        chunkParensResets = 0;
        i += opMatch[0].length;
        continue;
      }
    }
    currentChunk += curChar;
    i += 1;
  }
  if (braces !== 0) {
    throw Error(`Unbalanced parentheses in expression "${expr}"`);
  }
  appendChunk(result, currentChunk, chunkParensResets);
  return [result.filter(Boolean), opMatch, chunkParensResets];
}

export function parseSimExpr(rawExpr: string): Expression {
  for (let exprCreator of OperatorExpressions) {
    const [parts, opMatch, parensGroups] = splitExpr(rawExpr, exprCreator)
    if (parts.length === 1 && parensGroups === 1 && rawExpr.startsWith('(') && rawExpr.endsWith(')')) {
      return parseSimExpr(parts[0]);
    }
    if (opMatch && parts.length === exprCreator.numOperands) {
      return exprCreator.create(rawExpr, parts.map(parseSimExpr), opMatch) as Expression;
    }
  }

  for (let exprCreator of ValueExpressions) {
    const match = exprCreator.regex.exec(rawExpr);
    if (match) {
      return exprCreator.create(rawExpr, [], match) as Expression;
    }
  }

  throw Error(`Invalid expression: "${rawExpr}"`)
}

export function parseSimDef(simDef: string): Simulation[] {
  const [nameLevel, expr] = simDef.trim().split(/:(.*)/);
  if (!expr) {
    throw new Error(`Simulation definition "${simDef}" is not correctly formatted.`)
  }
  let levels = [0];
  let name = nameLevel;
  if (nameLevel.includes('@')) {
    const [namePart, levelsPart] = name.split('@');
    name = namePart;
    levels = parseRanges([levelsPart]);
  }
  let expression: Expression<unknown>;
  let error: string | undefined;
  const rawExpr = stripCommentsFromLines(expr).replace(/\s+/g, '');
  try {
    expression = parseSimExpr(rawExpr);
  } catch (e) {
    expression = parseSimExpr('0');
    error = String(e);
  }
  return levels.map((level) => {
    const sim = new Simulation(name, level, simDef, rawExpr, expression);
    sim.error = error;
    return sim;
  });
}

export function tryParseTestSimDef(simDef: string): Simulation[] {
  const sims = parseSimDef(simDef);
  sims.forEach((sim) => {
    if (!sim.error) {
      try {
        // Perform a test run, to make sure it's all good!
        sim.run(new SimState({ ac: 10, pb: 2, level: 1, sm: 0 }));
      } catch (e) {
        sim.error = String(e);
      }
    }
  });
  return sims;
}

export function parseTestSimDef(simDef: string): Simulation[] {
  const sims = tryParseTestSimDef(simDef);
  const firstError = sims.find((s) => s.error)?.error;
  if (firstError) {
    throw new Error(firstError);
  }
  return sims;
}

export function parseSimDefsScript(simDefsScript: string): ParsedSims {
  const errors: LineError[] = [];
  const sims: Simulation[] = [];
  const lines = simDefsScript.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    if (!stripComments(line).trim()) {
      continue;
    }
    const match = SimDefinitionRegex.exec(line);
    if (!match) {
      errors.push({ line: lineNum, message: `Invalid name@level definition: "${line}"` });
      continue;
    }

    let simDef = line;
    if (match[1].includes('(')) {
      let braces = 0;
      let j = i;
      let innerLine = match[1];
      do {
        if (!stripComments(line).trim()) {
          continue;
        }
        if (SimDefinitionRegex.test(innerLine)) {
          break;
        }
        for (let k = 0; k < innerLine.length; k++) {
          const char = innerLine[k];
          if (char === '(') {
            braces += 1;
          } else if (char === ')') {
            braces -= 1;
          }
        }
        j += 1;
        innerLine = lines[j];
      } while (braces > 0 && j < lines.length);
      const extraLines = lines.slice(i + 1, j).map((l) => l.trim()).join(' ');
      simDef = `${match[0].trim()} ${extraLines}`.trim();
      i = j - 1;
    }

    try {
      const parseResults = tryParseTestSimDef(simDef);
      const error = parseResults.find((sim) => sim.error)?.error;
      if (error) {
        errors.push({ line: lineNum, message: stripError(error) });
      } else {
        sims.push(...parseResults);
      }
    } catch (e) {
      errors.push({ line: lineNum, message: stripError(String(e)) });
    }
  }
  const simsByName = arrayBinned(sims, (sim) => sim.name);
  return { sims: simsByName, errors, names: Object.keys(simsByName) }
}
