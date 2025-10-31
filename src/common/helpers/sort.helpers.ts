const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export const sortByString = (stringA: string, stringB: string): number => {
  const lowerStringA = stringA?.toLowerCase();
  const lowerStringB = stringB?.toLowerCase();

  return collator.compare(lowerStringA, lowerStringB);
};
