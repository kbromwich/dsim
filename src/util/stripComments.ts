export const stripComments = (scriptLine: string) => {
  if (scriptLine.trim().startsWith('#')) {
    return '';
  }
  return scriptLine;
}

export const stripCommentsFromLines = (script: string) => {
  return script.split('\n').map(stripComments).join('\n');
}
