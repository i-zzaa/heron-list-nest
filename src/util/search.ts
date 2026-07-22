export const buildTextSearchWhere = (
  word: string,
  fields: string[] = [],
  extraWhere: Record<string, any> = {},
) => {
  const normalizedWord = word?.trim() || '';

  if (!normalizedWord) {
    return extraWhere;
  }

  const orConditions = fields.map((field) => {
    if (field.includes('.')) {
      const [relation, nestedField] = field.split('.');
      return {
        [relation]: {
          [nestedField]: {
            contains: normalizedWord,
          },
        },
      };
    }

    return {
      [field]: {
        contains: normalizedWord,
      },
    };
  });

  return {
    ...extraWhere,
    OR: orConditions,
  };
};
