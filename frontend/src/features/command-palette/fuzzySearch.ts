export type CommandSearchItem = {
  id: string;
  label: string;
  keywords: string[];
};

export function fuzzyMatch(query: string, item: CommandSearchItem) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return true;

  const tokens = `${item.label} ${item.keywords.join(' ')}`
    .toLocaleLowerCase()
    .split(/\s+/);

  return tokens.some((token) => {
    let queryIndex = 0;
    for (const character of token) {
      if (character === normalizedQuery[queryIndex]) queryIndex += 1;
      if (queryIndex === normalizedQuery.length) return true;
    }
    return false;
  });
}
