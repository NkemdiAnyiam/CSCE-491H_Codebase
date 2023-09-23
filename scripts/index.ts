import { enableButton, disableButton, /*wait*/ } from './utility.js';
import { createForm_multiInput, createForm_textarea } from './jobForm.js';
import { AnimSequence } from './AnimSequence.js';
import { WebFlik } from './TestUsability/WebFlik.js';

const {Exit, Entrance /*, Scroll*/} = WebFlik.createBanks({});

const maxNumJobs = 8;
const maxTime = 11;
const maxWeight = 99;

(function() {
  const mainMenu = document.querySelector('.main-menu')!;
  const maxJobsEl = mainMenu.querySelector('.fill--max-jobs') as HTMLInputElement;
  const maxTimeEl = mainMenu.querySelector('.fill--max-time') as HTMLInputElement;
  const maxWeightEl = mainMenu.querySelector('.fill--max-weight') as HTMLInputElement;

  maxJobsEl.value = maxNumJobs.toString();
  maxTimeEl.value = maxTime.toString();
  maxWeightEl.value = maxWeight.toString();
})();

const jobForm_multiInput = document.querySelector('.job-form--multi-input')!;
const jobForm_textarea = document.querySelector('.job-form--textarea')!;
const toggleFormButton_toTA = document.querySelector('.job-form__button--toggle-form--TA') as HTMLButtonElement;
const toggleFormButton_toMI = document.querySelector('.job-form__button--toggle-form--MI') as HTMLButtonElement;
disableButton(toggleFormButton_toMI);

toggleFormButton_toTA.addEventListener('click', swapForm);
toggleFormButton_toMI.addEventListener('click', swapForm);

const constraintOptions = { maxNumJobs, maxTime, maxWeight };
const {enableForm: enableForm_MI, disableForm: disableForm_MI} = createForm_multiInput(constraintOptions);
const {enableForm: enableForm_TA, disableForm: disableForm_TA} = createForm_textarea(constraintOptions);

// const scroll = Scroll(document.querySelector('.aaa'), document.querySelector('.chill')!, {scrollableOffset: 0, targetOffset: 0}, {duration: 1000});
// scroll.animation.generateTimePromise('forward', 'activePhase', '50%').then(() => {
//   scroll.animation.pause();
//   wait(2000).then(() => {
//     scroll.resume();
//   });
// });
// scroll.addRoadblocks('forward', 'activePhase', '90%', wait(3000));

const toggleSequence = new AnimSequence().addBlocks(...[
  // scroll,
  Exit(jobForm_multiInput, '~wipe', ['from-right'], { duration: 250 }),
  Entrance(jobForm_textarea, '~wipe', ['from-right'], { duration: 250 }),
]);

function swapForm(e: MouseEvent) {
  const toggleButton = e.target as HTMLButtonElement;
  disableButton(toggleButton); // disable currently pressed button
  // disable both forms for the transition
  disableForm_MI();
  disableForm_TA();

  // switch from multi-input form to textarea form
  if (toggleButton === toggleFormButton_toTA) {
    toggleSequence.play().then(() => { // play animation to swap forms
      enableForm_TA(); // enable textarea form
      enableButton(toggleFormButton_toMI); // enable button to switch back to multi-input form
    });
  }
  // switch from textarea form to multi-input form
  if (toggleButton === toggleFormButton_toMI) {
    toggleSequence.rewind().then(() => {
      enableForm_MI();
      enableButton(toggleFormButton_toTA);
    });
  }
}
