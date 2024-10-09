const stripError = (errorMessage: string) => {
  if (errorMessage.trim().toLowerCase().startsWith('error:')) {
    return errorMessage.trim().slice(6).trim();
  }
  return errorMessage;
}

export default stripError;
