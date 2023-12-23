export const equalWithinTol = (numA: number, numB: number): boolean => Math.abs(numA - numB) < 0.001;
export const mergeArrays = <T>(...arrays: Array<T>[]): Array<T> => Array.from(new Set(new Array<T>().concat(...arrays)));
export const negateNumString = (str: string): string => str[0] === '-' ? str.slice(1) : `-${str}`;
export const createStyles = (rules: string = ''): void => {
  let sheet = document.createElement('style');
  sheet.id = `wbfk-global-styles`;
  sheet.innerHTML = rules;
  document.body.appendChild(sheet);
}
