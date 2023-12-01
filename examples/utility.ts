export const invariant: (condition: any, msg?: string) => asserts condition = (condition: any, msg?: string) => {
  if (!condition) throw new Error(msg ?? 'Invariant failed');
};
