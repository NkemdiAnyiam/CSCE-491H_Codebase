import { stoi, stof } from './utility.js';
import { Job } from './Job.js';
import { generateVisualization } from "./WIS_visualization.js";

const maxNumJobs = 8;
const maxWeight = 99;
const maxTime = 11;

export function createForm(maxNumJobs) {
  const jobFormEl = document.querySelector('.job-form');
  const jobFormRowsEl = jobFormEl.querySelector('.job-form__jobs-inputs');
  const jobFormRowTemplateEl = document.getElementById('job-form__row-template');
  const addButton = jobFormEl.querySelector('.job-form__button--add');
  const generateButton = jobFormEl.querySelector('.job-form__button--submit');

  let numJobRows = 0;

  const addJobRow = () => {
    const newJobFormRowEl = document.importNode(jobFormRowTemplateEl.content, true).querySelector('.job-form__row');
    newJobFormRowEl.dataset.index = numJobRows;
    const jobFormRowLetterEl = newJobFormRowEl.querySelector('.job-form__job-letter');
    jobFormRowLetterEl.textContent = `Job ${String.fromCharCode(numJobRows + 65)}`;

    jobFormRowsEl.appendChild(newJobFormRowEl);

    ++numJobRows;
    
    if (numJobRows === maxNumJobs) { disableButton(addButton); }

    if (numJobRows === 2) {
      const disabledRemoveButton = jobFormRowsEl.querySelector('.job-form__button--remove.button-disabled');
      enableButton(disabledRemoveButton);
    }
  };

  const removeJobRow = (e) => {
    const removeButton = e.target.closest('.job-form__button--remove');
    if (!removeButton) { return; }

    addButton.disabled = false;
    addButton.classList.remove('button-disabled');
    
    const jobFormRowEl = removeButton.closest('.job-form__row');
    const rowIndex = stoi(jobFormRowEl.dataset.index);
    [...jobFormRowsEl.querySelectorAll('.job-form__row')].slice(rowIndex + 1).forEach((rowEl, i) => {
      rowEl.dataset.index = `${rowIndex + i}`;
      rowEl.querySelector('.job-form__job-letter').textContent = `Job ${String.fromCharCode(rowIndex + i + 65)}`;
    });
    jobFormRowEl.remove();
    --numJobRows;

    
    if (numJobRows === 1) { 
      const lastRemoveButton = jobFormRowsEl.querySelector('.job-form__button--remove');
      disableButton(lastRemoveButton);
    }
    
    if (jobFormEl.checkValidity()) { enableButton(generateButton); }
  };

  const enableButton = buttonEl => {
      buttonEl.disabled = false;
      buttonEl.classList.remove('button-disabled');
  }
  const disableButton = buttonEl => {
      buttonEl.disabled = true;
      buttonEl.classList.add('button-disabled');
  }

  const checkValidity = (e) => {
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
  };

  const validateTimeInputs = (input_start, input_finish) => {
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
  };

  const submit = (e) => {
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

      addButton.removeEventListener('click', addJobRow);
      jobFormEl.removeEventListener('click', removeJobRow);
      jobFormEl.removeEventListener('input', checkValidity);
      jobFormEl.removeEventListener('submit', submit);
      document.querySelector('.main-menu').remove();

      generateVisualization(jobsUnsorted);
    }
  };

  addButton.addEventListener('click', addJobRow);
  jobFormEl.addEventListener('click', removeJobRow);
  jobFormEl.addEventListener('input', checkValidity);
  jobFormEl.addEventListener('submit', submit);

  const addFirstJobFormRow = () => {
    addButton.dispatchEvent(new Event('click')); // add one job row by default
    const lastRemoveButton = jobFormRowsEl.querySelector('.job-form__button--remove');
    lastRemoveButton.disabled = true;
    lastRemoveButton.classList.add('button-disabled');
  };
  addFirstJobFormRow();
};











const jobFormEl = document.querySelector('.job-form');
const textarea = document.querySelector('.job-form .job-form__textarea');
const generateButton = jobFormEl.querySelector('.job-form__button--submit');
const jobTuplesValues = [];

jobFormEl.addEventListener('input', checkValidity);
jobFormEl.addEventListener('submit', submit);

textarea.value = `{0, 11, 1}`;
jobTuplesValues.push([0, 11, 1]);

// textarea.value = `
// {5, 9, 7},
// {8, 11, 5},
// {0, 6, 2},
// {1, 4, 1},
// {3, 8, 5},
// {4, 7, 4},
// {6, 10, 3},
// {3, 5, 6},
// `.trim();

const errorMessages = [];



function checkValidity(e) {
  let isValid = true;
  errorMessages.splice(0, errorMessages.length); // empty errorMessages array
  jobTuplesValues.splice(0, jobTuplesValues.length); // empty array of job tuples' values

  const textarea = e.target;
  const textString = textarea.value;

  // Note: Extra '\n' characters being pushed to errorMessages helps with prettier printing when displaying the errors

  // error if textarea is empty
  if (!textString)
    { errorMessages.push(`Total number of jobs must be in the range 0—${maxNumJobs}. Current number: 0\n`, '\n'); }

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
        { errorMessages.push(`Total number of jobs must be in the range 0—${maxNumJobs}. Current number: ${tuples.length}\n`, '\n'); }
  
      tuples.forEach(tuple => {
        const {startTime, finishTime, weight, isValid} = validateTuple(tuple);
        if (!isValid) { errorMessages.push('\n'); }
        else { jobTuplesValues.push([startTime, finishTime, weight]) };
      });
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

  if (startTime >= finishTime) {
    errorMessages.push(`In tuple ${tuple}: start time must be less than finish time.\n`);
    isValid = false;
  }
  if (startTime > maxTime || startTime < 0 || !Number.isSafeInteger(startTime)) {
    errorMessages.push(`In tuple ${tuple}: start time must be an integer in the range 0—${maxTime}.\n`);
    isValid = false;
  }
  if (finishTime > maxTime || finishTime < 0 || !Number.isSafeInteger(startTime)) {
    errorMessages.push(`In tuple ${tuple}: finish time must be an integer in the range 0—${maxTime}.\n`);
    isValid = false;
  }
  if (weight > maxWeight || weight < 0 || !Number.isSafeInteger(weight)) {
    errorMessages.push(`In tuple ${tuple}: weight must be an integer in the range 0—${maxWeight}.\n`);
    isValid = false;
  }

  return {startTime, finishTime, weight, isValid};
}

function submit(e) {
  e.preventDefault();
  if (jobFormEl.checkValidity()) {
    const jobsUnsorted = [];
    console.log(jobTuplesValues);
    jobTuplesValues.forEach(([startTime, finishTime, weight]) => jobsUnsorted.push(new Job(startTime, finishTime, weight)));

    jobFormEl.removeEventListener('input', checkValidity);
    jobFormEl.removeEventListener('input', submit);
    document.querySelector('.main-menu').remove();
    generateVisualization(jobsUnsorted);
  }
}

function enableButton(buttonEl) {
  buttonEl.disabled = false;
  buttonEl.classList.remove('button-disabled');
}

function disableButton(buttonEl) {
  buttonEl.disabled = true;
  buttonEl.classList.add('button-disabled');
}

