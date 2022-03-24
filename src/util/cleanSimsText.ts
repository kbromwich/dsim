const cleanSimsText = (simsText: string[]) => {
  return simsText.filter((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('#');
  });
}

export default cleanSimsText;
