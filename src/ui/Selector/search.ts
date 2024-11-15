
const search = (searchText: string, options: string[], caseInsensitive: boolean) => {
  const search = caseInsensitive ? searchText.toLowerCase() : searchText;
  return options.filter((simName) => {
    const name = caseInsensitive ? simName.toLowerCase() : simName;
    return name.includes(search);
  });
};

export default search;
