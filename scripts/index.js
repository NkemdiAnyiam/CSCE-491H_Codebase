import { enableButton, disableButton } from './utility.js';
import { createForm_multiInput, createForm_textarea } from './jobForm.js';
import { AnimSequence } from './AnimSequence.js';

const jobForm_multiInput = document.querySelector('.job-form--multi-input');
const jobForm_textarea = document.querySelector('.job-form--textarea');
const toggleFormButton_toTA = document.querySelector('.job-form__button--toggle-form--TA');
const toggleFormButton_toMI = document.querySelector('.job-form__button--toggle-form--MI');
disableButton(toggleFormButton_toMI);
// let defaultShown = true;

toggleFormButton_toTA.addEventListener('click', swapForm);
toggleFormButton_toMI.addEventListener('click', swapForm);

const constraintOptions = { maxNumJobs: 8, maxTime: 11, maxWeight: 99 };
const {enableForm: enableForm_MI, disableForm: disableForm_MI} = createForm_multiInput(constraintOptions);
const {enableForm: enableForm_TA, disableForm: disableForm_TA} = createForm_textarea(constraintOptions);

const toggleSequence = new AnimSequence([
  [ 'std', jobForm_multiInput, 'exit-wipe-to-left', { duration: 250 } ],
  [ 'std', jobForm_textarea, 'enter-wipe-from-right', { duration: 250 } ],
]);


function swapForm(e) {
  const toggleButton = e.target;
  disableButton(toggleButton);
  if (toggleButton === toggleFormButton_toTA) {
    disableForm_MI();
    toggleSequence.play().then(() => {
      enableForm_TA();
      enableButton(toggleFormButton_toMI);
    });
  }
  if (toggleButton === toggleFormButton_toMI) {
    disableForm_TA();
    toggleSequence.rewind().then(() => {
      enableForm_MI();
      enableButton(toggleFormButton_toTA);
    });
  }
}

// function swapForm() {
//   disableButton(toggleFormButton);
//   if (defaultShown) {
//     disableForm_MI();
//     toggleSequence.play().then(() => {
//       enableForm_TA();
//       defaultShown = !defaultShown;
//       enableButton(toggleFormButton);
//     });
//   }
//   else {
//     disableForm_TA();
//     toggleSequence.rewind().then(() => {
//       enableForm_MI();
//       defaultShown = !defaultShown;
//       enableButton(toggleFormButton);
//     });
//   }
// }
