export const wait = (milliseconds: number): Promise<void> => new Promise(resolve => setTimeout(resolve, milliseconds));
export const stoi = (string: string): number => Number.parseInt(string);
export const stof = (string: string): number => Number.parseFloat(string);
export const getRandInt = (maximum: number): number => Math.floor(Math.random() * (maximum + 1)); // includes maximum
export const getRandIntRange = (minimum: number, maximum: number): number => Math.floor(Math.random() * (maximum + 1 - minimum)) + minimum; // includes maximum
export function enableButton(buttonEl: HTMLButtonElement): void {
  buttonEl.disabled = false;
  buttonEl.classList.remove('button-disabled');
}
export function disableButton(buttonEl: HTMLButtonElement): void {
  buttonEl.disabled = true;
  buttonEl.classList.add('button-disabled');
}
