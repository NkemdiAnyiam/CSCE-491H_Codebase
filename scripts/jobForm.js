import { stoi } from './utility.js';
import { Job } from './Job.js';
import { generateVisualization } from "./WIS_visualization.js";


export const createForm = () => {
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
    
    if (numJobRows === 8) { disableButton(addButton); }

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
