const stripComments = (scriptLine: string) => {
  if (scriptLine.trim().startsWith('#')) {
    return '';
  }
  return scriptLine;
}

export default stripComments;
