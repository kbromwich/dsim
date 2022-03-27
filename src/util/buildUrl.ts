const buildUrl = (params: Record<string, string>) => {
  const search = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
  return `${process.env.PUBLIC_URL}?${search}`;
};

export default buildUrl;
