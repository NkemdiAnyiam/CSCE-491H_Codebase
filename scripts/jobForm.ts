import { stoi, stof, enableButton, disableButton, getRandInt, getRandIntRange } from './utility.js';
import { Job } from './Job.js';
import { generateVisualization } from "./WIS_visualization.js";
import { AnimBlock } from './WebFlik/AnimBlock.js';
import { WebFlik } from './WebFlik/WebFlik.js';

const {Entrance, Exit} = WebFlik.createBanks({});


/****************************************/
/* MULTI-INPUT FUNCTIONS */
/****************************************/
export function createForm_multiInput({maxNumJobs, maxWeight, maxTime}) {
  const jobFormEl = document.querySelector('.job-form--multi-input');
  const jobFormRowsEl = jobFormEl.querySelector('.job-form__jobs-rows');
  const jobFormRowTemplateEl = document.getElementById('job-form__row-template');
  const addButton = jobFormEl.querySelector('.job-form__button--add');
  const randomizeButton = jobFormEl.querySelector('.job-form__button--randomize');
  const generateButton = jobFormEl.querySelector('.job-form__button--submit');
  let numJobRows = 0;
  // Set up initial input values and constraints for template
  (function() {
    const startTimeInputTemplate  = jobFormRowTemplateEl.content.querySelector('.job-form__input--startTime');
    const finishTimeInputTemplate  = jobFormRowTemplateEl.content.querySelector('.job-form__input--finishTime');
    const weightInputTemplate  = jobFormRowTemplateEl.content.querySelector('.job-form__input--weight');
    startTimeInputTemplate.value = 0;
    startTimeInputTemplate.max = maxTime;
    finishTimeInputTemplate.value = maxTime;
    finishTimeInputTemplate.max = maxTime;
    weightInputTemplate.value = 1;
    weightInputTemplate.max = maxWeight;
  })();

  enableForm();
  addButton.dispatchEvent(new Event('click')); // add one job row by default
  // disable first remove button
  const lastRemoveButton = jobFormRowsEl.querySelector('.job-form__button--remove');
  disableButton(lastRemoveButton);

  function removeJobRow_listener (e) {
    const removeButton = e.target.closest('.job-form__button--remove');
    if (!removeButton) { return; }
    const jobFormRowEl = removeButton.closest('.job-form__row');

    removeJobRow(jobFormRowEl);
    
    if (numJobRows === 1) { 
      const lastRemoveButton = jobFormRowsEl.querySelector('.job-form__button--remove');
      disableButton(lastRemoveButton);
    }
  }

  function randomizeJobRows() {
    const randNumJobs = getRandIntRange(1, maxNumJobs);

    // remove all jobs rows
    while (numJobRows > 0) {
      const lastJobRowEl = jobFormEl.querySelector('.job-form__row:last-child');
      removeJobRow(lastJobRowEl);
    }

    // add randomized job rows
    addRandomJobRow();
    const lastRemoveButton = jobFormRowsEl.querySelector('.job-form__button--remove');
    disableButton(lastRemoveButton);
    while (numJobRows < randNumJobs) {
      addRandomJobRow();
    }
  }

  function addRandomJobRow() {
    const randStart = getRandInt(maxTime - 1);
    const randFinish = getRandIntRange(randStart + 1, maxTime);
    const randWeight = getRandInt(maxWeight);

    addJobRow({startTime: randStart, finishTime: randFinish, weight: randWeight});
  }

  function addJobRow ({startTime = 0, finishTime = maxTime, weight = 1}) {
    const newJobFormRowEl = document.importNode(jobFormRowTemplateEl.content, true).querySelector('.job-form__row');
    const jobFormRowLetterEl = newJobFormRowEl.querySelector('.job-form__job-letter');
    const startInputEl = newJobFormRowEl.querySelector('.job-form__input--startTime');
    const finishInputEl = newJobFormRowEl.querySelector('.job-form__input--finishTime');
    const weightInputEl = newJobFormRowEl.querySelector('.job-form__input--weight');

    newJobFormRowEl.dataset.index = numJobRows;
    jobFormRowLetterEl.textContent = `Job ${String.fromCharCode(numJobRows + 65)}`;
    startInputEl.value = startTime;
    finishInputEl.value = finishTime;
    weightInputEl.value = weight;

    jobFormRowsEl.appendChild(newJobFormRowEl);

    ++numJobRows;
    
    if (numJobRows === maxNumJobs) { disableButton(addButton); }

    if (numJobRows === 2) {
      const disabledRemoveButton = jobFormRowsEl.querySelector('.job-form__button--remove.button-disabled');
      enableButton(disabledRemoveButton);
    }
  }

  function removeJobRow(jobFormRowEl) {
    const rowIndex = stoi(jobFormRowEl.dataset.index);
    [...jobFormRowsEl.querySelectorAll('.job-form__row')].slice(rowIndex + 1).forEach((rowEl, i) => { // rowIndex + 1 to skip <template></template>
      rowEl.dataset.index = `${rowIndex + i}`;
      rowEl.querySelector('.job-form__job-letter').textContent = `Job ${String.fromCharCode(rowIndex + i + 65)}`;
    });
    jobFormRowEl.remove();
    --numJobRows;

    enableButton(addButton);
    if (jobFormEl.checkValidity()) { enableButton(generateButton); }
  }

  function checkValidity (e) {
    const input = e.target;

    const isTimeInput = input.classList.contains('job-form__input--startTime') || input.classList.contains('job-form__input--finishTime');

    if (isTimeInput) {
      const jobFormRowEl = input.closest('.job-form__row');
      const input_start = jobFormRowEl.querySelector('[name="startTime"]');
      const input_finish = jobFormRowEl.querySelector('[name="finishTime"]');
      validateTimeInputs(input_start, input_finish);
    }
    else {
      const errorMessageEl_weight = input.closest('label').nextElementSibling;
      errorMessageEl_weight.textContent = input.validity.valid ? '' : input.validationMessage;
    }

    if (!jobFormEl.checkValidity()) { disableButton(generateButton); }
    else { enableButton(generateButton); }
  }

  function validateTimeInputs (input_start, input_finish) {
    const errorMessageEl_start = input_start.closest('label').nextElementSibling;
    const errorMessageEl_finish = input_finish.closest('label').nextElementSibling;

    if (stoi(input_start.value) >= stoi(input_finish.value)) {
      input_start.setCustomValidity('Value must be less than finish time.');
      input_finish.setCustomValidity('Value must be greater than start time.');
      
      errorMessageEl_start.textContent = input_start.validationMessage;
      errorMessageEl_finish.textContent = input_finish.validationMessage;
    }
    else {
      input_start.setCustomValidity('');
      input_finish.setCustomValidity('');
    }

    errorMessageEl_start.textContent = input_start.validity.valid ? '' : input_start.validationMessage;
    errorMessageEl_finish.textContent = input_finish.validity.valid ? '' : input_finish.validationMessage;
  }

  function submit (e) {
    e.preventDefault();
    if (jobFormEl.checkValidity()) {
      const jobsUnsorted = [];
      jobFormRowTemplateEl.remove();
      
      for (let i = 0; i < numJobRows; ++i) {
        const jobFormRowEl = jobFormRowsEl.children[i];
        const input_start = jobFormRowEl.querySelector('[name="startTime"]');
        const input_finish = jobFormRowEl.querySelector('[name="finishTime"]');
        const input_weight = jobFormRowEl.querySelector('[name="weight"]');

        jobsUnsorted.push(new Job(
          stoi(input_start.value),
          stoi(input_finish.value),
          stoi(input_weight.value),
        ));
      }

      disableForm();
      const mainMenuEl = document.querySelector('.main-menu');
      const fadeoutMainMenu = Exit(mainMenuEl, '~fade-out', [], {duration: 375});
      fadeoutMainMenu.play()
        .then(() => {
          mainMenuEl.remove();
          generateVisualization(jobsUnsorted);
        });
    }
  }

  function enableForm() {
    addButton.addEventListener('click', addJobRow);
    randomizeButton.addEventListener('click', randomizeJobRows);
    jobFormEl.addEventListener('click', removeJobRow_listener);
    jobFormEl.addEventListener('input', checkValidity);
    jobFormEl.addEventListener('submit', submit);
    if (jobFormEl.checkValidity()) { enableButton(generateButton); }
    if ( numJobRows < maxNumJobs ) { enableButton(addButton); }
    enableButton(randomizeButton);
    if ( numJobRows > 1 ) { jobFormEl.querySelectorAll('.job-form__button--remove').forEach((removeButton) => enableButton(removeButton)); }
  }

  function disableForm() {
    addButton.removeEventListener('click', addJobRow);
    randomizeButton.removeEventListener('click', randomizeJobRows);
    jobFormEl.removeEventListener('click', removeJobRow_listener);
    jobFormEl.removeEventListener('input', checkValidity);
    jobFormEl.removeEventListener('submit', submit);
    disableButton(generateButton);
    disableButton(addButton);
    disableButton(randomizeButton);
    jobFormEl.querySelectorAll('.job-form__button--remove').forEach((removeButton) => disableButton(removeButton));
  }

  return {enableForm, disableForm};
};


/****************************************/
/* TEXTAREA FUNCTIONS */
/****************************************/
export function createForm_textarea({maxNumJobs, maxWeight, maxTime}) {
  const jobFormEl = document.querySelector('.job-form--textarea') as HTMLFormElement;
  const textarea = jobFormEl.querySelector('.job-form__textarea--user');
  const generateButton = jobFormEl.querySelector('.job-form__button--submit');
  const jobTuplesValues: [startTime: number, finishTime: number, weight: number][] = []; // holds arrays of the form [startTime, finishTime, weight]

  // provide an initial job entry in textarea
  textarea.value = `{0, ${maxTime}, 1}`;
  jobTuplesValues.push([0, maxTime, 1]);

  // set the example text
  (function() {
    const exampleTextarea = jobFormEl.querySelector('.job-form__textarea--example');
    exampleTextarea.value = `{5, 9, 7},\n{8, 11, 5},\n{0, 6, 2},\n{1, 4, 1},\n{3, 8, 5},\n{4, 7, 4},\n{6, 10, 3},\n{3, 5, 6},\
    \n\n(Commas, Semicolons, or white spaces can be used to separate tuples, but they are optional)`;
  })();

  const errorMessages = [];

  function checkValidity(e) {
    let isValid = true;
    errorMessages.splice(0, errorMessages.length); // empty errorMessages array
    jobTuplesValues.splice(0, jobTuplesValues.length); // empty array of job tuples' values

    const textarea = e.target;
    const textString = textarea.value;

    // Note: Extra '\n' characters being pushed to errorMessages helps with prettier printing when displaying the errors

    // error if textarea is empty
    if (!textString.trim())
      { errorMessages.push(`Total number of jobs must be in the range 1—${maxNumJobs}. Current number: 0\n`, '\n'); }

    else {
      // try to match entire string to ensure proper formating
      const reWholeString = /(?:(?:\s|$)*(\{[^\S\r\n]*(-?\d+(?:\.\d+)?),[^\S\r\n]*(-?\d+(?:\.\d+)?),[^\S\r\n]*(-?\d+(?:\.\d+)?)[^\S\r\n]*\})(,|;)?(?:\s|$)*)+/m;
      if (textString.match(reWholeString)?.[0] !== textString) {
        errorMessages.push('Invalid input formatting.\n', '\n');
      }
      // if formatting is correct, validate each tuple
      else {
        const reMatchTuples = /\{[^\S\r\n]*-?\d+(?:\.\d+)?,[^\S\r\n]*-?\d+(?:\.\d+)?,[^\S\r\n]*-?\d+(?:\.\d+)?[^\S\r\n]*\}/gm; // to get the tuples
        const tuples = textString.match(reMatchTuples);
    
        // error if too many job tuples
        if (tuples.length > maxNumJobs)
          { errorMessages.push(`Total number of jobs must be in the range 1—${maxNumJobs}. Current number: ${tuples.length}\n`, '\n'); }
        else {
          tuples.forEach(tuple => {
            const {startTime, finishTime, weight, isValid} = validateTuple(tuple);
            if (!isValid) { errorMessages.push('\n'); }
            else { jobTuplesValues.push([startTime, finishTime, weight]) };
          });
        }
      }
    }
    
    // print errors (if any)
    const errorMessageEl = textarea.closest('label').nextElementSibling;
    errorMessageEl.textContent = ''; // first reset the error text content
    if (errorMessages.length > 0) {
      errorMessages.slice(0, -1) // slicing last element gets rid of last extra '\n'
        .forEach(message => {
          errorMessageEl.textContent += message;
        });

      isValid = false;
    }
    
    if (isValid) {
      textarea.setCustomValidity('');
      enableButton(generateButton);
    }
    else {
      textarea.setCustomValidity('invalid');
      disableButton(generateButton);
    }
    return isValid;
  }

  function validateTuple (tuple) {
    let isValid = true;

    const reCaptureGroups = /\{[^\S\r\n]*(-?\d+(?:\.\d+)?),[^\S\r\n]*(-?\d+(?:\.\d+)?),[^\S\r\n]*(-?\d+(?:\.\d+)?)[^\S\r\n]*\}/; // captures each individual value
    const [startTime, finishTime, weight] = tuple.match(reCaptureGroups)
      .slice(1) // gets rid of the entry containing the whole tuple
      .map(valueString => stof(valueString)); // convert each captured value string to a float
    const errorMessageIntro = `In tuple {${startTime}, ${finishTime}, ${weight}}`;

    if (startTime >= finishTime) {
      errorMessages.push(`${errorMessageIntro}: start time must be less than finish time.\n`);
      isValid = false;
    }
    if (startTime > maxTime || startTime < 0 || !Number.isSafeInteger(startTime)) {
      errorMessages.push(`${errorMessageIntro}: start time must be an integer in the range 0—${maxTime}.\n`);
      isValid = false;
    }
    if (finishTime > maxTime || finishTime < 0 || !Number.isSafeInteger(finishTime)) {
      errorMessages.push(`${errorMessageIntro}: finish time must be an integer in the range 0—${maxTime}.\n`);
      isValid = false;
    }
    if (weight > maxWeight || weight < 0 || !Number.isSafeInteger(weight)) {
      errorMessages.push(`${errorMessageIntro}: weight must be an integer in the range 1—${maxWeight}.\n`);
      isValid = false;
    }

    return {startTime, finishTime, weight, isValid};
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (jobFormEl.checkValidity()) {
      const jobsUnsorted: Job[] = [];
      jobTuplesValues.forEach(([startTime, finishTime, weight]) => jobsUnsorted.push(new Job(startTime, finishTime, weight)));

      disableForm();
      const mainMenuEl = document.querySelector('.main-menu')!;
      const fadeoutMainMenu = Exit(mainMenuEl, '~fade-out', [], {duration: 375});
      fadeoutMainMenu.play()
        .then(() => {
          mainMenuEl.remove();
          generateVisualization(jobsUnsorted);
        });
    }
  }

  const enableForm = () => {
    jobFormEl.addEventListener('input', checkValidity);
    jobFormEl.addEventListener('submit', submit);
    if (jobFormEl.checkValidity()) { enableButton(generateButton); }
  };

  const disableForm = () => {
    jobFormEl.removeEventListener('input', checkValidity);
    jobFormEl.removeEventListener('input', submit);
    disableButton(generateButton);
  };

  return { enableForm, disableForm };
}


