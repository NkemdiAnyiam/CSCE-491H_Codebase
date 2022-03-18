export const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
export const stoi = string => Number.parseInt(string);
export const stof = string => Number.parseFloat(string);
