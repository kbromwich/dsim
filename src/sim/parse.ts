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
  let levels = [0];
  let name = nameLevel;
  if (nameLevel.includes('@')) {
    const [namePart, levelsPart] = name.split('@');
    name = namePart;
    levels = parseRanges([levelsPart]);
  }
  return levels.map((level) => {
    const rawExpr = expr.replace(/ /g, '');
    return new Simulation(name, level, simDef, rawExpr, parseSimExpr(rawExpr));
  });
}

export function parseTestSimDef(simDef: string): Simulation[] {
  const sims = parseSimDef(simDef);
  sims.forEach((sim) => {
    // Perform a test run, to make sure it's all good!
    sim.run(new SimState({ ac: 10, pb: 2, level: 1, sm: 0 }));
  });
  return sims;
}

export function tryParseTestSimDef(simDef: string): Simulation[] {
  try {
    return parseTestSimDef(simDef);
  } catch (e) {
    log.info(`Failed to parse simulation definition "${simDef}": ${e}`, e);
    return [];
  }
}

function tryParseSims(simDefs: string[]): Simulation[] {
  return simDefs.map(tryParseTestSimDef).flat();
}
