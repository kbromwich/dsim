
const search = (searchText: string, options: string[], caseInsensitive: boolean) => {
  return options.filter((simName) => {
    const name = caseInsensitive ? simName.toLowerCase() : simName;
    return name.includes(searchText);
  });
};

export default search;
