export const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
export const stoi = string => Number.parseInt(string);
export const stof = string => Number.parseFloat(string);
export const getRandInt = maximum => Math.floor(Math.random() * (maximum + 1)); // includes maximum
export const getRandIntRange = (minimum, maximum) => Math.floor(Math.random() * (maximum + 1 - minimum)) + minimum; // includes maximum
export function enableButton(buttonEl) {
  buttonEl.disabled = false;
  buttonEl.classList.remove('button-disabled');
}
export function disableButton(buttonEl) {
  buttonEl.disabled = true;
  buttonEl.classList.add('button-disabled');
}
