import log from 'util/log';
import parseRanges from 'util/parseRanges';
import Expression from './Expression';
import { SplitExpressions, ValueExpressions } from './expressions';
import SimState from './SimState';
import Simulation from './Simulation';

function regexMatchAt(regex: RegExp, str: string, index: number): string | undefined {
  const m = regex.exec(str.substring(index));
  return (m?.index === 0 || undefined) && m?.[0];
}

function appendChunk(result: string[], chunk: string, resets: number) {
  if (resets === 1 && chunk.startsWith('(') && chunk.endsWith(')')) {
    chunk = chunk.substring(1, chunk.length - 1);
  }
  result.push(chunk);
}

function splitExpr(expr: string, opRegex: RegExp): [string[], number] {
  const result: string[] = [];
  let braces = 0;
  let currentChunk = '';
  let chunkParensResets = 0;
  let i = 0;
  while (i < expr.length) {
    const curChar = expr[i]
    if (curChar === '(') {
      braces += 1;
    } else if (curChar === ')') {
      braces -= 1;
      if (braces === 0) {
        chunkParensResets += 1;
      }
    }
    const opMatch = regexMatchAt(opRegex, expr, i)
    if (braces === 0 && opMatch) {
        appendChunk(result, currentChunk, chunkParensResets);
        currentChunk = '';
        chunkParensResets = 0;
        i += opMatch.length;
    } else {
      currentChunk += curChar;
      i += 1;
    }
  }
  if (braces !== 0) {
    throw Error(`Unbalanced parentheses in expression "${expr}"`);
  }
  appendChunk(result, currentChunk, chunkParensResets)
  return [result, chunkParensResets]
}

export function parseSimExpr(rawExpr: string): Expression {
  for (let exprCreator of SplitExpressions) {
    const [parts, parensGroups] = splitExpr(rawExpr, exprCreator.regex)
    if (parts.length === 1 && parensGroups === 1 && rawExpr.startsWith('(') && rawExpr.endsWith(')')) {
      return parseSimExpr(parts[0])
    }
    if (parts.length > 1) {
      return exprCreator.create(rawExpr, parts.map(parseSimExpr)) as Expression;
    }
  }

  for (let exprCreator of ValueExpressions) {
    if (exprCreator.regex.exec(rawExpr)) {
      return exprCreator.create(rawExpr, []) as Expression;
    }
  }

  throw Error(`Invalid expression: "${rawExpr}"`)
}

export function parseSimDef(simDef: string): Simulation[] {
  const [nameLevel, expr] = simDef.split(/:(.*)/);
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
  const rawExpr = expr.replace(/ /g, '');
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
