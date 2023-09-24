export const equalWithinTol = (numA: number, numB: number): boolean => Math.abs(numA - numB) < 0.001;
export const mergeArrays = <T>(...arrays: Array<T>[]): Array<T> => Array.from(new Set(new Array<T>().concat(...arrays)));
export const negateNumString = (str: string) => str[0] === '-' ? str.slice(1) : `-${str}`;

interface Nothing {};
export type Union<T, U> = T | (U & Nothing);
