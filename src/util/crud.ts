export const getPrismaClient = (prismaService: any) =>
  prismaService.getPrismaClient();

export const buildCreatePayload = (body: any, fields: string[] = []) => {
  if (!fields.length) return body;

  return Object.keys(body || {}).reduce((acc, key) => {
    if (fields.includes(key)) {
      acc[key] = body[key];
    }
    return acc;
  }, {} as any);
};
