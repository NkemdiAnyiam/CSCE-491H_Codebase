import { enableButton, disableButton } from './utility.js';
import { createForm, createForm2 } from './jobForm.js';
import { AnimSequence } from './AnimSequence.js';

const toggleFormButton = document.querySelector('.toggleForm');
const jobForm_multiInput = document.querySelector('.job-form--multi-input');
const jobForm_textarea = document.querySelector('.job-form--textarea');
let defaultShown = true;

toggleFormButton.addEventListener('click', swapForm);

const {enableForm: enableForm_MI, disableForm: disableForm_MI} = createForm(8);
const {enableForm: enableForm_TA, disableForm: disableForm_TA} = createForm2();

const toggleSequence = new AnimSequence([
  [ 'std', jobForm_multiInput, 'exit-wipe-to-left', { duration: 250 } ],
  [ 'std', jobForm_textarea, 'enter-wipe-from-right', { duration: 250 } ],
]);

function swapForm() {
  disableButton(toggleFormButton);
  if (defaultShown) {
    disableForm_MI();
    toggleSequence.play().then(() => {
      enableForm_TA();
      defaultShown = !defaultShown;
      enableButton(toggleFormButton);
    });
  }
  else {
    disableForm_TA();
    toggleSequence.rewind().then(() => {
      enableForm_MI();
      defaultShown = !defaultShown;
      enableButton(toggleFormButton);
    });
  }
}
