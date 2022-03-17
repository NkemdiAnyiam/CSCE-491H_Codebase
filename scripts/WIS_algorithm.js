import { Job } from './Job.js';
import { JobScheduler } from './JobScheduler.js';
import { AnimBlock } from './AnimBlock.js';
import { AnimBlockLine } from './AnimBlockLine.js';
import { AnimSequence } from './AnimSequence.js';
import { AnimTimeline } from "./AnimTimeline.js";

const stoi = string => Number.parseInt(string);

const formEl = document.querySelector('.job-form');
const formRowsEl = formEl.querySelector('.job-form__jobs-inputs');
const inputs_startTime = [...formEl.querySelectorAll(`[name="startTime"]`)];
const inputs_finishTime = [...formEl.querySelectorAll(`[name="finishTime"]`)];
const inputs_weight = [...formEl.querySelectorAll(`[name="weight"]`)];
const jobFormRowTemplateEl = document.getElementById('job-form__row-template');
const addButton = formEl.querySelector('.job-form__button--add');

let numJobs = 0;

const addJobRow = () => {
  if (numJobs >= 8) { console.error('Already 8 jobs'); return; }

  const jobFormRowEl = document.importNode(jobFormRowTemplateEl.content, true).querySelector('.job-form__row');
  const jobFormRowLetterEl = jobFormRowEl.querySelector('.job-form__job-letter');
  jobFormRowLetterEl.textContent = `Job ${String.fromCharCode(numJobs++ + 65)}`;

  inputs_startTime.push(jobFormRowEl.querySelector(`[name="startTime"]`));
  inputs_finishTime.push(jobFormRowEl.querySelector(`[name="finishTime"]`));
  inputs_weight.push(jobFormRowEl.querySelector(`[name="weight"]`));

  formRowsEl.appendChild(jobFormRowEl);
};

addJobRow();

addButton.addEventListener('click', addJobRow);

const checkTimeValid = (index) => {
  const inputStart = inputs_startTime[index];
  const inputFinish = inputs_finishTime[index];

  if (stoi(inputStart.value) >= stoi(inputFinish.value)) {
    inputStart.setCustomValidity('Value must be less than finish time.');
    inputFinish.setCustomValidity('Value must be greater than start time.');
    const errorMessageEl_start = inputStart.closest('label').nextElementSibling;
    const errorMessageEl_finish = inputFinish.closest('label').nextElementSibling;
    errorMessageEl_start.textContent = inputStart.validationMessage;
    errorMessageEl_finish.textContent = inputFinish.validationMessage;
  }
  else {
    inputStart.setCustomValidity('');
    inputFinish.setCustomValidity('');
  }
};

formEl.addEventListener('input', (e) => {
  const input = e.target;
  const index = Math.max(inputs_startTime.indexOf(input), inputs_finishTime.indexOf(input));
  if (index > -1) {
    checkTimeValid(index);
    const inputStart = inputs_startTime[index];
    const inputFinish = inputs_finishTime[index];

    const errorMessageEl_start = inputStart.closest('label').nextElementSibling;
    const errorMessageEl_finish = inputFinish.closest('label').nextElementSibling;

    errorMessageEl_start.textContent = inputStart.validity.valid ? '' : inputStart.validationMessage;
    errorMessageEl_finish.textContent = inputFinish.validity.valid ? '' : inputFinish.validationMessage;
  }
  else {
    const errorMessageEl = input.closest('label').nextElementSibling;
    errorMessageEl.textContent = input.validity.valid ? '' : input.validationMessage;
  }
});

formEl.addEventListener('submit', (e) => {
  e.preventDefault();
  if (formEl.checkValidity()) {
    const jobsUnsorted = [];
    for (let i = 0; i < inputs_startTime.length; ++i) {
      jobsUnsorted.push(new Job(
        stoi(inputs_startTime[i].value),
        stoi(inputs_finishTime[i].value),
        stoi(inputs_weight[i].value)
      ));
    }
    doThing(jobsUnsorted);
  }
});

const doThing = (jobsUnsorted) => {
  const mainMenu = document.querySelector('.main-menu');
  mainMenu.remove();
  const viz = document.querySelector('.visualization');
  viz.classList.remove('hidden');
  // TODO: Move this somewhere else
  const dataDisplay = document.querySelector('.data-display');
  document.addEventListener('scroll', function(e) {
    dataDisplay.style.left = `${-window.scrollX}px`;
  });

  // const jobsUnsorted = [
  //   new Job(5, 9, 7),
  //   new Job(8, 11, 5),
  //   new Job(0, 6, 2),
  //   new Job(1, 4, 1),
  //   new Job(3, 8, 5),
  //   new Job(4, 7, 4),
  //   new Job(6, 10, 3),
  //   new Job(3, 5, 6),
  // ];

  const jobScheduler = new JobScheduler();

  jobsUnsorted.forEach(job => {
    jobScheduler.addJob(job);
  });
  jobScheduler.sortJobsByFinish();
  jobScheduler.setCompatibleJobNums();
  jobScheduler.initializeM();

  jobScheduler.computeOPT(jobScheduler.getNumJobs(), document.querySelector('.job-cards'));
  // jobScheduler.print();
  jobScheduler.setUpScene(jobsUnsorted);
  const jobsSorted = jobScheduler.getJobs();

  (function() {
    const freeLineArrows = [...document.querySelectorAll('.free-line--arrow')];
    freeLineArrows.forEach((freeLine, i) => {
      const line = freeLine.querySelector('.free-line__line');
      const marker = freeLine.querySelector('marker');

      const id = `markerArrow--${i}`
      marker.id = id;
      line.style.markerEnd = `url(#${id})`;
    });
  })();


  const animTimeline = new AnimTimeline(null, {debugMode: true});

  const timeGraphEl = document.querySelector('.time-graph');
  const timeGraphRowEls = [...document.querySelectorAll('.time-graph__row')];
  // const jobBarEls = [...document.querySelectorAll('.time-graph__job-bar')];


  const textbox_placeBars = dataDisplay.querySelector('.text-box-line-group--place-bars .text-box');
  const freeLine_placeBars = dataDisplay.querySelector('.text-box-line-group--place-bars .free-line');
  const textP_placeBars_unorder = textbox_placeBars.querySelector('.text-box__paragraph--unorder');
  const textP_placeBars_unorder2 = textbox_placeBars.querySelector('.text-box__paragraph--unorder-2');
  const textP_placeBars_order = textbox_placeBars.querySelector('.text-box__paragraph--order');
  const textP_placeBars_ordered = textbox_placeBars.querySelector('.text-box__paragraph--ordered');
  // Describe that we're about to move bars onto graph
  {
    
    const animSequence = new AnimSequence();
    animSequence.setDescription(`Describe that we're about to move bars onto graph`);
    animSequence.addManyBlocks([
      [ 'line', freeLine_placeBars, 'enter-wipe-from-bottom', null, [0.5, 1], jobsUnsorted[0].getJobBar(), [0.5, 0] ],
      [ 'std', textbox_placeBars, 'fade-in', {blocksPrev: false} ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }

  // Move job bars onto time graph in unsorted order
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Move job bars onto time graph in unsorted order');
    animSequence.addOneBlock(new AnimBlockLine(freeLine_placeBars, 'exit-wipe-to-top', null, [0.5, 1], jobsUnsorted[0].getJobBar(), [0.5, 0], {blocksNext: false}));
    jobsUnsorted.forEach((job) => {
      const jobBarEl = job.getJobBar();
      // set up options for moving job bars to correct location
      const jobLetter = jobBarEl.dataset.jobletter;
      const startCell = document.querySelector(`.time-graph__row[data-jobletterunsorted="${jobLetter}"]  .time-graph__cell--${jobBarEl.dataset.start}`);
      const options = { translateOptions: { targetElem: startCell } };
      animSequence.addOneBlock(new AnimBlock(jobBarEl, 'translate', options));
    });
    animSequence.addManyBlocks([
      [ 'std', textP_placeBars_unorder, 'fade-out', {duration: 250} ],
      [ 'std', textP_placeBars_unorder2, 'fade-in', {duration: 250} ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  // Move job bars back off of the time graph
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Move job bars back off of the time graph');
    animSequence.addManyBlocks([
      [ 'std', textP_placeBars_unorder2, 'fade-out', {duration: 250} ],
      [ 'std', textP_placeBars_order, 'fade-in', {duration: 250} ],
    ]);
    const jobBarsInitialArea = document.querySelector('.time-graph__job-bars');
    jobsUnsorted.forEach((job) => {
      const jobBarEl = job.getJobBar();
      const options = {blocksPrev: false, blocksNext: false, translateOptions: { targetElem: jobBarsInitialArea } };
      animSequence.addOneBlock(new AnimBlock(jobBarEl, 'translate', options));
    });

    animTimeline.addOneSequence(animSequence);
  }


  // Move job bars back onto the time graph (sorted by finish time) and update time graph row headers
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Move job bars back onto the time graph (sorted by finish time) and update time graph row headers');
    jobsSorted.forEach((job) => {
      const jobBarEl = job.getJobBar();
      // set up options for moving job bars to correct location
      const jobLetter = jobBarEl.dataset.jobletter;
      const row = document.querySelector(`.time-graph__row[data-joblettersorted="${jobLetter}"]`);
      const startCell = row.querySelector(`.time-graph__cell--${jobBarEl.dataset.start}`);
      
      // get row's header data to animate
      const rowSJNum = row.querySelector('.time-graph__SJ-num');
      const rowUnsortedLetter = row.querySelector('.time-graph__job-letter--unsorted');
      const rowSortedLetter = row.querySelector('.time-graph__job-letter--sorted');
      
      animSequence.addManyBlocks([
        [ 'std', jobBarEl, 'translate', { blocksNext: false, translateOptions: { targetElem: startCell } } ],
        [ 'std', rowUnsortedLetter, 'exit-wipe-to-left', {blocksPrev: false, duration: 250} ],
        [ 'std', rowSJNum, 'enter-wipe-from-right', {blocksNext: false, blocksPrev: false, duration: 250} ],
        [ 'std', rowSortedLetter, 'enter-wipe-from-right', {blocksPrev: false, duration: 250} ],
      ]);
    });

    animSequence.addManyBlocks([
      [ 'std', textP_placeBars_order, 'fade-out', {duration: 250} ],
      [ 'std', textP_placeBars_ordered, 'fade-in', {duration: 250} ],
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  const arrayGroup_j_c = dataDisplay.querySelector('.array-group--j-and-c');
  const cArray = arrayGroup_j_c.querySelector('.array--c');
  const jArray1 = arrayGroup_j_c.querySelector('.array--j');
  const textbox_cArray = dataDisplay.querySelector('.text-box-line-group--c-array .text-box');
  const freeLine_cArray = dataDisplay.querySelector('.text-box-line-group--c-array .free-line');
  const textP_cArray_explain = textbox_cArray.querySelector('.text-box__paragraph--explain');
  const textP_cArray_refArray = textbox_cArray.querySelector('.text-box__paragraph--ref-array');
  // Explain what a compatible job is
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Explain what a compatible job is');
    animSequence.addManyBlocks([
      [ 'std', textbox_placeBars, 'fade-out' ],
      [ 'std', jArray1, 'enter-wipe-from-left' ],
      [ 'std', cArray, 'enter-wipe-from-left', {blocksPrev: false} ],
      [ 'std', textbox_cArray, 'fade-in', {blocksPrev: false} ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }

  // Explain what c array will be used for
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Explain what c array will be used for');
    animSequence.addManyBlocks([
      [ 'line', freeLine_cArray, 'enter-wipe-from-left', null, [0, 0.5], cArray, [1, 0.5] ],
      [ 'std',  textP_cArray_explain, 'fade-out', {duration: 250} ],
      [ 'std',  textP_cArray_refArray, 'fade-in', {duration: 250} ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }

  // Hide explanation of c array's purpose and continue into next phase
  {
    const animSequence = new AnimSequence(null, {continueNext: true}); // after hiding, immediately continue into next phase
    animSequence.setDescription(`Hide explanation of c array's purpose and continue into next phase`);
    animSequence.addManyBlocks([
      [ 'std', textbox_cArray, 'fade-out', {blocksNext: false} ],
      [ 'line', freeLine_cArray, 'exit-wipe-to-left', null, [0, 0.5], cArray, [1, 0.5] ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  // Demonstrate how to fill out the c array
  const textbox_fillCArray = dataDisplay.querySelector('.text-box-line-group--fill-c-array .text-box');
  const cBar = document.querySelector('.time-graph__c-bar'); // vertical bar
  const timeGraphArrowEl = timeGraphEl.querySelector('.free-line'); // arrow connecting c entry and compatible job's row header
  jobsSorted.forEach((job) => {
    const jobBarEl = job.getJobBar();
    // get j array block corresponding to current job bar
    const jBlock = document.querySelector(`.array-group--j-and-c .array--j .array__array-block--${jobBarEl.dataset.sjnum}`);
    // Find job bar corresponding to the job that's compatible with the current job (if it exists)
    const compatibleJobBarEl = document.querySelector(`.time-graph__job-bar[data-sjnum="${jobBarEl.dataset.compatiblejobnum}"]`);
    // get the c array entry corresponding to the current job
    const cBlock = cArray.querySelector(`.array__array-block--${jobBarEl.dataset.sjnum}`);
    const cEntryValue = cBlock.querySelector(`.array__array-entry--value`);
    const cEntryBlank = cBlock.querySelector(`.array__array-entry--blank`);
    let row;
    let rowSJNum;

    const textP_fillCArray_forJobX = textbox_fillCArray.querySelector(`.text-box__paragraph--for-job-${jobBarEl.dataset.sjnum}`);
    const textP_fillCArray_resultJobX = textbox_fillCArray.querySelector(`.text-box__paragraph--result-job-${jobBarEl.dataset.sjnum}`);
    const textP_fillCArray_continueOn = textbox_fillCArray.querySelector(`.text-box__paragraph--continue-on`);

    // Move cbar to current job bar, unhide it, and highlight current job bar and j array block
    {
      const animSequence = new AnimSequence(null, {continuePrev: true});
      animSequence.setDescription('Move cbar to current job bar, unhide it, and highlight current job bar and j array block');
      animSequence.addManyBlocks([
        [ 'std', cBar, 'translate', {duration: 0, translateOptions: { targetElem: jobBarEl, preserveY: true }} ],
        [ 'std', jobBarEl, 'highlight', {blocksNext: false} ],
        [ 'std', jBlock, 'highlight', {blocksNext: false, blocksPrev: false} ],
        [ 'std', cBar, 'enter-wipe-from-top', {blocksPrev: false} ],
        [ 'std', textP_fillCArray_forJobX, 'fade-in', {duration: 0} ],
        [ 'std', textbox_fillCArray, 'fade-in' ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }


    // move cbar, highlight compatible job if exists, and point to c array
    {
      const animSequence = new AnimSequence();
      const animSequence2 = new AnimSequence();
      animSequence.setDescription('Move cbar and highlight compatible job if it exists');
      animSequence2.setDescription('Point to c array and fill entry');
      // If the compatible job exists, Move cbar to compatible job bar and highlight it
      // Then point arrow from compatible row header to current c-array entry
      if (compatibleJobBarEl) {
        row = document.querySelector(`.time-graph__row[data-joblettersorted="${compatibleJobBarEl.dataset.jobletter}"]`);
        rowSJNum = row.querySelector('.time-graph__SJ-num');
        animSequence.addManyBlocks([
          [ 'std', cBar, 'translate', {translateOptions: { targetElem: compatibleJobBarEl, alignmentX: 'right', preserveY: true }} ],
          [ 'std', compatibleJobBarEl, 'highlight' ],
        ]);
        animSequence2.addOneBlock(new AnimBlockLine(timeGraphArrowEl, 'enter-wipe-from-top', rowSJNum, [1, 0.5], cBlock, [0.5, 0], {blocksPrev: false}));
      }
      // If not compatible job exists, move cbar to left of time graph
      // Then point arrow from bottom of cbar to current c-array entry
      else {
        animSequence.addManyBlocks([
          [ 'std', cBar, 'translate', {translateOptions: { targetElem: timeGraphEl, alignmentX: 'left', preserveY: true }} ],
        ]);
        animSequence2.addOneBlock(new AnimBlockLine(timeGraphArrowEl, 'enter-wipe-from-top', cBar, [0, 1], cBlock, [0.5, 0], {blocksPrev: false}));
      }

      animSequence.addManyBlocks([
        [ 'std', textP_fillCArray_forJobX, 'fade-out', {duration: 250} ],
        [ 'std', textP_fillCArray_resultJobX, 'fade-in', {duration: 250} ],
      ])
    
      // "Update" current c-array entry
      animSequence2.addManyBlocks([
        [ 'std', cEntryBlank, 'exit-wipe-to-left', {blocksPrev: false, blocksNext: false} ],
        [ 'std', cEntryValue, 'enter-wipe-from-right', {blocksPrev: false} ],
        [ 'std', textP_fillCArray_resultJobX, 'fade-out', {duration: 250, blocksPrev: false} ],
        [ 'std', textP_fillCArray_continueOn, 'fade-in', {duration: 250} ],
      ]);
    
      animTimeline.addOneSequence(animSequence);
      animTimeline.addOneSequence(animSequence2);
    }


    // Hide cbar and arrow and un-highlight everything
    {
      const animSequence = new AnimSequence(null, {continueNext: true});
      animSequence.setDescription('Hide cbar and arrow and un-highlight everything');
      if (compatibleJobBarEl) {
        animSequence.addManyBlocks([
          [ 'std', compatibleJobBarEl, 'un-highlight', {blocksNext: false} ],
          [ 'line', timeGraphArrowEl, 'exit-wipe-to-top', rowSJNum, [1, 0.5], cBlock, [0.5, 0], {blocksPrev: false, blocksNext: false} ]
        ]);
      }
      else {
        animSequence.addOneBlock([ 'line', timeGraphArrowEl, 'exit-wipe-to-top', cBar, [0, 1], cBlock, [0.5, 0], {blocksPrev: false, blocksNext: false} ]);
      }
      animSequence.addManyBlocks([
        [ 'std', textbox_fillCArray, 'fade-out', {blocksPrev: false} ],
        [ 'std', textP_fillCArray_continueOn, 'fade-out', {duration: 0}],
        [ 'std', cBar, 'fade-out', {blocksNext: false, blocksPrev: false} ],
        [ 'std', jobBarEl, 'un-highlight', {blocksPrev: false, blocksNext: false} ],
        [ 'std', jBlock, 'un-highlight', {blocksPrev: false} ],
      ]);
      animTimeline.addOneSequence(animSequence);
    }
  });


  const textbox_finishedCArray = dataDisplay.querySelector('.text-box-line-group--finished-c-array .text-box');
  const freeLine_showNaive = dataDisplay.querySelector('.text-box-line-group--show-naive .free-line');
  const textbox_showNaive = dataDisplay.querySelector('.text-box-line-group--show-naive .text-box');
  const algorithm_term1 = textbox_showNaive.querySelector('.algorithm__term-1');
  const algorithm_term2 = textbox_showNaive.querySelector('.algorithm__term-2');
  // State that now we need to find the maximum weight
  {
    const animSequence = new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('State that now we need to find the maximum weight');
    animSequence.setTag('finished c array');
    animSequence.addManyBlocks([
      [ 'std', textbox_finishedCArray, 'fade-in' ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  // Show naive approach to finding max weight
  {
    const animSequence = new AnimSequence(null);
    animSequence.setDescription('Explain naive approach to finding max weight');
    animSequence.setTag('show naive');
    animSequence.addManyBlocks([
      [ 'std', textbox_showNaive, 'translate', {duration: 0, translateOptions: {targetElem: textbox_finishedCArray, offsetTargetY: 1, offsetY: 10, offsetUnitsY: 'rem'}} ],
      [ 'line', freeLine_showNaive, 'enter-wipe-from-top', textbox_finishedCArray, [0.5, 1], null, [0.5, 0] ],
      [ 'std', textbox_showNaive, 'fade-in' ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }

  const textbox_explainNaive1 = dataDisplay.querySelector('.text-box-line-group--explain-naive-1 .text-box');
  const freeLine_explainNaive1 = dataDisplay.querySelector('.text-box-line-group--explain-naive-1 .free-line');
  // Explain possibility that job is part of optimal sequence
  {
    const animSequence = new AnimSequence(null);
    animSequence.setDescription('Explain possibility that job is part of optimal sequence');
    animSequence.setTag('explain naive');
    animSequence.addManyBlocks([
      [ 'std', textbox_explainNaive1, 'translate', {duration: 0, translateOptions: {targetElem: textbox_showNaive, offsetTargetY: 1, offsetY: 10, offsetUnitsY: 'rem', offsetTargetX: -1.0, offsetX: 10, offsetUnitsX: 'rem'}} ],
      [ 'std', algorithm_term1, 'highlight' ],
      [ 'line', freeLine_explainNaive1, 'enter-wipe-from-top', algorithm_term1, [0.5, 1], null, [0.5, 0] ],
      [ 'std', textbox_explainNaive1, 'fade-in' ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }

  const textbox_explainNaive2 = dataDisplay.querySelector('.text-box-line-group--explain-naive-2 .text-box');
  const freeLine_explainNaive2 = dataDisplay.querySelector('.text-box-line-group--explain-naive-2 .free-line');
  // Explain possibility that job is NOT part of optimal sequence
  {
    const animSequence = new AnimSequence(null);
    animSequence.setDescription('Explain possibility that job is NOT part of optimal sequence');
    animSequence.setTag('explain naive');
    animSequence.addManyBlocks([
      [ 'std', textbox_explainNaive2, 'translate', {duration: 0, translateOptions: {targetElem: textbox_showNaive, offsetTargetY: 1, offsetY: 10, offsetUnitsY: 'rem', offsetTargetX: 1.0, offsetX: -10, offsetUnitsX: 'rem', alignmentX: 'right'}} ],
      [ 'std', algorithm_term2, 'highlight' ],
      [ 'line', freeLine_explainNaive2, 'enter-wipe-from-top', algorithm_term2, [0.5, 1], null, [0.5, 0] ],
      [ 'std', textbox_explainNaive2, 'fade-in' ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }

  // Hide naive approach explanations
  {
    const animSequence = new AnimSequence(null, {continueNext: true});
    animSequence.setDescription('Hide naive approach explanations');
    animSequence.setTag('explain naive bad');
    animSequence.addManyBlocks([
      [ 'std', textbox_explainNaive1, 'fade-out', {blocksNext: false} ],
      [ 'std', textbox_explainNaive2, 'fade-out', {blocksNext: false, blocksPrev: false} ],
      [ 'line', freeLine_explainNaive1, 'exit-wipe-to-top', algorithm_term1, [0.5, 1], null, [0.5, 0], {blocksNext: false} ],
      [ 'line', freeLine_explainNaive2, 'exit-wipe-to-top', algorithm_term2, [0.5, 1], null, [0.5, 0], {blocksNext: false, blocksPrev: false} ],
      [ 'std', algorithm_term1, 'un-highlight', {blocksNext: false} ],
      [ 'std', algorithm_term2, 'un-highlight', {blocksPrev: false} ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  const textbox_explainNaiveBad = dataDisplay.querySelector('.text-box-line-group--explain-naive-bad .text-box');
  const freeLine_explainNaiveBad = dataDisplay.querySelector('.text-box-line-group--explain-naive-bad .free-line');
  // Explain why naive approach is bad
  {
    const animSequence = new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('Explain why naive approach is bad');
    animSequence.addManyBlocks([
      [ 'std', textbox_explainNaiveBad, 'translate', {duration: 0, translateOptions: {targetElem: textbox_showNaive, offsetTargetY: 1, offsetY: 10, offsetUnitsY: 'rem'}} ],
      [ 'line', freeLine_explainNaiveBad, 'enter-wipe-from-top', textbox_showNaive, [0.5, 1], null, [0.5, 0] ],
      [ 'std', textbox_explainNaiveBad, 'fade-in', {blocksPrev: false} ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  const naiveAlgorithmText = dataDisplay.querySelector('.naive-algorithm-text');
  // Collapse text boxes about the naive approach
  {
    const animSequence = new AnimSequence(null, {continueNext: true});
    animSequence.setDescription('Collapse text boxes about the naive approach');
    animSequence.addManyBlocks([
      [ 'std', naiveAlgorithmText, 'fade-out' ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }

  const arrayGroup_j_M = dataDisplay.querySelector('.array-group--j-and-M');
  const MArray = arrayGroup_j_M.querySelector('.array--M');
  const jArray2 = arrayGroup_j_M.querySelector('.array--j');
  const textbox_MArray = dataDisplay.querySelector('.text-box-line-group--M-array .text-box');
  const freeLine_MArray = dataDisplay.querySelector('.text-box-line-group--M-array .free-line');
  const textP_MArray_explain = textbox_MArray.querySelector('.text-box__paragraph--explain');
  const textP_MArray_refArray = textbox_MArray.querySelector('.text-box__paragraph--ref-array');
  // Explain memoization
  {
    const animSequence = new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('Explain memoization');
    animSequence.setTag('introduce memoization');
    animSequence.addManyBlocks([
      [ 'std', jArray2, 'enter-wipe-from-left' ],
      [ 'std', MArray, 'enter-wipe-from-left', {blocksPrev: false} ],
      [ 'std', textbox_MArray, 'fade-in' ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }

  const arrayBlock_M_0 = MArray.querySelector('.array__array-block--0');
  const arrayBlank_M_0 = arrayBlock_M_0.querySelector('.array__array-entry--blank');
  const arrayValue_M_0 = arrayBlock_M_0.querySelector('.array__array-entry--value');
  // Explain what M array will be used for
  {
    const animSequence = new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('Explain what M array will be used for');
    animSequence.addManyBlocks([
      [ 'line', freeLine_MArray, 'enter-wipe-from-left', null, [0, 0.5], MArray, [1, 0.5] ],
      [ 'std',  textP_MArray_explain, 'fade-out', {duration: 250} ],
      [ 'std',  textP_MArray_refArray, 'fade-in', {duration: 250} ],
      [ 'std', arrayBlank_M_0, 'fade-out' ],
      [ 'std', arrayValue_M_0, 'fade-in' ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  const textbox_showMemoized = dataDisplay.querySelector('.text-box-line-group--show-memoized .text-box');
  const freeLine_showMemoized = dataDisplay.querySelector('.text-box-line-group--show-memoized .free-line');
  // Show memoized algorithm
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Show memoized algorithm');
    animSequence.addManyBlocks([
      [ 'std', textbox_showMemoized, 'translate', {duration: 0, translateOptions: {targetElem: textbox_MArray, offsetTargetX: 1, offsetX: 20, offsetXUnits: 'rem', preserveY: true}} ],
      [ 'line', freeLine_showMemoized, 'enter-wipe-from-left', textbox_MArray, [1, 0.5], null, [0, 0.5] ],
      [ 'std',  textbox_showMemoized, 'fade-in' ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  const MArrayTextBoxes = MArray.querySelector('.text-boxes');
  // Hide M array text explanation boxes
  {
    const animSequence = new AnimSequence(null, {continueNext: true});
    animSequence.setDescription('Hide memoized algorithm');
    animSequence.addManyBlocks([
      [ 'std', MArrayTextBoxes, 'fade-out' ],
    ]);
    animTimeline.addOneSequence(animSequence);
  }



  animateJobCard_R(document.querySelector('.job-card'));

  function animateJobCard_R(jobCard, parentAnimSequence, parentArrowDown, parentArrowSource, aboveBullet) {
    const SJNum = Number.parseInt(jobCard.dataset.sjnum);
    const jobCardContent = jobCard.querySelector('.job-card-content');
    const SJNumLabel = jobCardContent.querySelector('.job-card-SJ-num-label');
    const MAccessContainer = jobCard.querySelector('.M-access-container');
    const MAccess = jobCard.querySelector('.M-access');
    const MEntry = jobCard.querySelector('.M-entry');
    const freeLine_MAccess = jobCard.querySelector('.text-box-line-group--M-access .free-line');
    const textbox_MAccess = jobCard.querySelector('.text-box-line-group--M-access .text-box');
    const textP_MAccess_intro = textbox_MAccess.querySelector('.text-box__paragraph--intro');
    const textP_MAccess_solved = textbox_MAccess.querySelector('.text-box__paragraph--solved');

    const freeLine_toMBlock = jobCard.querySelector('.free-line--M-access-to-M-block');


    const arrowContainer = jobCard.querySelector('.arrow-container');
    const formulaContainer = jobCard.querySelector('.formula-container');
    const formulaComputation = jobCard.querySelector('.formula-computation');
    const formulaResult = jobCard.querySelector('.formula-result');
    const freeLine_formulaComputation = jobCard.querySelector('.text-box-line-group--formula-computation .free-line');
    const textbox_formulaComputation = jobCard.querySelector('.text-box-line-group--formula-computation .text-box');
    const textP_formulaComputation_find = textbox_formulaComputation.querySelector('.text-box__paragraph--find');
    const textP_formulaComputation_max = textbox_formulaComputation.querySelector('.text-box__paragraph--max');
    const textP_formulaComputation_found = textbox_formulaComputation.querySelector('.text-box__paragraph--found');


    const computation1 = jobCard.querySelector('.computation--1');
    const computationResult1 = computation1.querySelector('.computation-result');
    const freeLine_computation1 = jobCard.querySelector('.text-box-line-group--computation--1 .free-line');
    const textbox_computation1 = jobCard.querySelector('.text-box-line-group--computation--1 .text-box');
    const computationExpression1 = jobCard.querySelector('.computation--1 .computation-expression');
    const textP_computation1_intro = textbox_computation1.querySelector('.text-box__paragraph--intro');
    const textP_computation1_summary = textbox_computation1.querySelector('.text-box__paragraph--summary');
    const cAccessContainer = jobCard.querySelector('.c-access-container');
    const cAccess = jobCard.querySelector('.c-access');
    const cEntry = jobCard.querySelector('.c-entry');
    const freeLine_cAccess = jobCard.querySelector('.text-box-line-group--c-access .free-line');
    const textbox_cAccess = jobCard.querySelector('.text-box-line-group--c-access .text-box');
    const textP_cAccess_find = textbox_cAccess.querySelector('.text-box__paragraph--find');
    const textP_cAccess_found = textbox_cAccess.querySelector('.text-box__paragraph--found');
    const freeLine_toCBlock = jobCard.querySelector('.free-line--c-access-to-c-block');
    const OPTExpressionContainer1 = jobCard.querySelector('.computation-expression--1 .OPT-expression-container');
    const OPTExpression1 = OPTExpressionContainer1.querySelector('.OPT-expression');
    const OPTResult1 = OPTExpressionContainer1.querySelector('.OPT-result');
    const freeLine_OPTExpression1 = jobCard.querySelector('.text-box-line-group--OPT-expression-1 .free-line');
    const textbox_OPTExpression1 = jobCard.querySelector('.text-box-line-group--OPT-expression-1 .text-box');
    const textP_OPTExpression1_find = textbox_OPTExpression1.querySelector('.text-box-line-group--OPT-expression-1 .text-box__paragraph--find');
    const textP_OPTExpression1_found = textbox_OPTExpression1.querySelector('.text-box-line-group--OPT-expression-1 .text-box__paragraph--found');


    const computation2 = jobCard.querySelector('.computation--2');
    const computationResult2 = computation2.querySelector('.computation-result');
    const OPTExpression2 = computation2.querySelector('.OPT-expression');
    const freeLine_computation2 = jobCard.querySelector('.text-box-line-group--computation--2 .free-line');
    const textbox_computation2 = jobCard.querySelector('.text-box-line-group--computation--2 .text-box');
    const textP_computation2_intro = textbox_computation2.querySelector('.text-box__paragraph--intro');
    const textP_computation2_summary = textbox_computation2.querySelector('.text-box__paragraph--summary');
    const freeLine_OPTExpression2 = jobCard.querySelector('.text-box-line-group--OPT-expression-2 .free-line');
    const textbox_OPTExpression2 = jobCard.querySelector('.text-box-line-group--OPT-expression-2 .text-box');
    const textP_OPTExpression2_find = textbox_OPTExpression1.querySelector('.text-box-line-group--OPT-expression-2 .text-box__paragraph--find');
    const nextSJNumExpression = computation2.querySelector('.next-SJ-num-expression');
    const nextSJNum = computation2.querySelector('.next-SJ-num');


    const jobCardChild1 = [...jobCard.querySelector('.job-card-children').children][0];
    const jobCardChild2 = [...jobCard.querySelector('.job-card-children').children][1];


    const MBlock = document.querySelector(`.array--M .array__array-block--${SJNum}`);
    const MBlock_blank = MBlock.querySelector(`.array__array-entry--blank`);
    const MBlock_value = MBlock.querySelector(`.array__array-entry--value`);
    const cBlock = document.querySelector(`.array--c .array__array-block--${SJNum}`);


    const freeLine_upTree = jobCard.querySelector('.free-line--up-tree');
    const freeLine_downTree = jobCard.querySelector('.free-line--down-tree');
    const jobCardBullet = jobCard.querySelector('.job-card-bullet');


    // fade in job card and M access
    {
      const animSequence = parentAnimSequence ?? new AnimSequence(null, {continuePrev: true});
      animSequence.setDescription('Fade in job card and M access');
      animSequence.setTag('start');
      animSequence.addManyBlocks([
        [ 'std', jobCard, 'fade-in', {blocksNext: parentArrowDown ? false : true} ],
      ]);
      if (parentArrowDown) {
        animSequence.addManyBlocks([
          [ 'line', parentArrowDown, 'enter-wipe-from-top', parentArrowSource, [0, 1], SJNumLabel, [0.5, -0.2], {blocksPrev: false} ],
        ]);
      }
      if (aboveBullet) {
        const freeLine_bulletConnector = jobCard.querySelector('.free-line--bullet-connector');
        animSequence.addManyBlocks([
          [ 'line', freeLine_bulletConnector, 'enter-wipe-from-top', aboveBullet, [0.5, 0.5], jobCardBullet, [0.5, 0.5] ],
        ]);
      }
      animSequence.addManyBlocks([
        [ 'std', MAccess, 'fade-in' ],
        [ 'std', MAccessContainer, 'highlight', {blocksNext: false, blocksPrev: false} ],
        [ 'line', freeLine_MAccess, 'enter-wipe-from-bottom', MAccess, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
        [ 'std', textbox_MAccess, 'fade-in', {blocksPrev: false} ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }


    // point to M block array entry
    {
      const animSequence = new AnimSequence();
      animSequence.setDescription('Point to M block array entry');
      animSequence.addOneBlock([ 'line', freeLine_toMBlock, 'enter-wipe-from-right', MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5], {lineOptions: {trackEndpoints: true}} ]);

      animTimeline.addOneSequence(animSequence);
    }


    // focus on formula container
    {
      const animSequence = new AnimSequence();
      animSequence.setDescription('Focus on formula container');
      animSequence.addManyBlocks([
        [ 'line', freeLine_toMBlock, 'exit-wipe-to-right', MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5], {lineOptions: {trackEndpoints: true}} ],
        [ 'std', textbox_MAccess, 'fade-out', {blocksNext: false} ],
        [ 'line', freeLine_MAccess, 'exit-wipe-to-bottom', MAccess, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
        [ 'std', MAccessContainer, 'un-highlight' ],

        [ 'std', arrowContainer, 'enter-wipe-from-right' ],
        [ 'std', formulaComputation, 'fade-in', {blocksPrev: false} ],
        [ 'std', formulaComputation, 'highlight', {blocksNext: false} ],
        [ 'line', freeLine_formulaComputation, 'enter-wipe-from-bottom', formulaComputation, [0.1, 0.2], null, [0.5, 1], {blocksPrev: false} ],
        [ 'std', textbox_formulaComputation, 'fade-in', {blocksPrev: false} ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }


    // focus on computation 1
    {
      const animSequence = new AnimSequence();
      animSequence.setDescription('Focus on computation 1');
      animSequence.addManyBlocks([
        [ 'std', textbox_formulaComputation, 'fade-out', {blocksNext: false} ],
        [ 'line', freeLine_formulaComputation, 'exit-wipe-to-bottom', formulaComputation, [0.1, 0.2], null, [0.5, 1], {blocksNext: false} ],
        [ 'std', formulaComputation, 'un-highlight', {blocksPrev: false} ],

        [ 'std', computationExpression1, 'highlight', {blocksNext: false} ],
        [ 'line', freeLine_computation1, 'enter-wipe-from-bottom', computation1, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
        [ 'std', textbox_computation1, 'fade-in', {blocksPrev: false} ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }


    // focus on c access
    {
      const animSequence = new AnimSequence();
      animSequence.setDescription('Focus on c access');
      animSequence.setTag('skip to');
      animSequence.addManyBlocks([
        [ 'std', textbox_computation1, 'fade-out', {blocksNext: false} ],
        [ 'line', freeLine_computation1, 'exit-wipe-to-bottom', computation1, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
        [ 'std', computationExpression1, 'un-highlight', {blocksNext: false, blocksPrev: false} ],
    
        [ 'std', cAccessContainer, 'highlight', {blocksPrev: false} ],
        [ 'line', freeLine_cAccess, 'enter-wipe-from-bottom', cAccessContainer, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
        [ 'std', textbox_cAccess, 'fade-in', {blocksPrev: false} ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }


    // point to c array entry
    {
      const animSequence = new AnimSequence();
      animSequence.setDescription('Point to c array entry');
      animSequence.addManyBlocks([
        [ 'line', freeLine_toCBlock, 'enter-wipe-from-right', cAccessContainer, [0, 0.5], cBlock, [0.9, 0.5], {blocksPrev: false, lineOptions: {trackEndpoints: true}} ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }


    // Reverse arrow and replace c access with value
    {
      const animSequence = new AnimSequence();
      animSequence.setDescription('Reverse arrow and replace c access with value');
      animSequence.addManyBlocks([
        [ 'line', freeLine_toCBlock, 'fade-out', cAccessContainer, [0, 0.5], cBlock, [0.9, 0.5], {lineOptions: {trackEndpoints: true}} ],
        [ 'line', freeLine_toCBlock, 'enter-wipe-from-left', cBlock, [0.9, 0.5], cAccessContainer, [-0.1, 0.5], {lineOptions: {trackEndpoints: true}} ],
        [ 'line', freeLine_cAccess, 'updateEndpoints', cAccessContainer, [0.5, -0.2], null, [0.5, 1] ],
        [ 'std', cAccess, 'exit-wipe-to-left', {blocksPrev: false} ],
        [ 'std', cEntry, 'enter-wipe-from-right', {blocksNext: false} ],
        [ 'line', freeLine_cAccess, 'updateEndpoints', cAccessContainer, [0.5, -0.2], null, [0.5, 1] ],
        [ 'std', textP_cAccess_find, 'fade-out', { duration: 250 } ],
        [ 'std', textP_cAccess_found, 'fade-in', { duration: 250 } ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }


    // Focus on OPT expression 1 as a whole
    {
      const animSequence = new AnimSequence();
      animSequence.setDescription('Focus on OPT expression 1 as a whole');
      animSequence.addManyBlocks([
        // hide arrow for c block
        [ 'line', freeLine_toCBlock, 'fade-out', cBlock, [0.9, 0.5], cAccessContainer, [0, 0.5], {lineOptions: {trackEndpoints: true}} ],
    
        // remove c access text
        [ 'std', textbox_cAccess, 'fade-out', {blocksNext: false} ],
        [ 'line', freeLine_cAccess, 'exit-wipe-to-bottom', cAccessContainer, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
        [ 'std', cAccessContainer, 'un-highlight', {blocksPrev: false} ],
    
        // enter OPT expression 1 text
        [ 'std', OPTExpressionContainer1, 'highlight', {blocksPrev: false, blocksNext: false} ],
        [ 'line', freeLine_OPTExpression1, 'enter-wipe-from-bottom', OPTExpressionContainer1, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
        [ 'std', textbox_OPTExpression1, 'fade-in', {blocksPrev: false} ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }

    
    let sourceEl_OPT1, freeLine_fromSourceEl1;
    {
      const animSeqPassDown = new AnimSequence();
      animSeqPassDown.addManyBlocks([
        [ 'std', textbox_OPTExpression1, 'fade-out', {blocksNext: false} ],
        [ 'line', freeLine_OPTExpression1, 'exit-wipe-to-bottom', cAccessContainer, [0.5, -0.2], null, [0.5, 1] ],
      ]);
      let animSequence;
      // RECURSE 1
      [animSequence, sourceEl_OPT1, freeLine_fromSourceEl1] = jobCardChild1.classList.contains('job-card--stub') ?
        animateJobStub(jobCardChild1, animSeqPassDown, freeLine_downTree, OPTExpressionContainer1, jobCardBullet) :
        animateJobCard_R(jobCardChild1, animSeqPassDown, freeLine_downTree, OPTExpressionContainer1, jobCardBullet);
      // replace OPT1 expression with answer, change text box text
      animSequence.setDescription('Replace OPT1 expression with answer, change text box text');
      animSequence.setTag('OPT point 1');
      animSequence.addManyBlocks([
        [ 'line', freeLine_fromSourceEl1, 'enter-wipe-from-bottom', sourceEl_OPT1, [0.5, -0.2], OPTExpressionContainer1, [0, 1.1] ],
        [ 'std', OPTExpression1, 'exit-wipe-to-left', {blocksPrev: false} ],
        [ 'std', OPTResult1, 'enter-wipe-from-right', {blocksNext: false} ],
        [ 'std', textP_OPTExpression1_find, 'fade-out', { duration: 250 } ],
        [ 'std', textP_OPTExpression1_found, 'fade-in', { duration: 250 } ],
        [ 'line', freeLine_OPTExpression1, 'enter-wipe-from-bottom', OPTResult1, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
        [ 'std', textbox_OPTExpression1, 'fade-in', {blocksPrev: false} ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }
    

    // remove arrow coming from child, hide current text; replace computation expression with answer; and focus on whole computation1 (swap text as well)
    {
      const animSequence = new AnimSequence();
      animSequence.setDescription(`Remove arrow coming from child, hide current text, replace computation expression with answer, and focus on whole computation1 (swap text as well)`);
      animSequence.addManyBlocks([
        [ 'line', freeLine_fromSourceEl1, 'fade-out', sourceEl_OPT1, [0.5, -0.2], OPTExpressionContainer1, [0, 1], {blocksNext: false} ],
        [ 'std', textbox_OPTExpression1, 'fade-out', {blocksPrev: false, blocksNext: false} ],
        [ 'line', freeLine_OPTExpression1, 'exit-wipe-to-bottom', OPTExpressionContainer1, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
        [ 'std', OPTExpressionContainer1, 'un-highlight', {blocksPrev: false} ],
    
        [ 'std', textP_computation1_intro, 'fade-out', {duration: 0, blocksNext: false} ],
        [ 'std', textP_computation1_summary, 'fade-in', {duration: 0, blocksPrev: false} ],
        [ 'std', computationExpression1, 'exit-wipe-to-left', ],
        [ 'std', computationResult1, 'enter-wipe-from-right', ],
        [ 'std', computationResult1, 'highlight', {blocksPrev: false, blocksNext: false} ],
        [ 'line', freeLine_computation1, 'enter-wipe-from-bottom', computationResult1, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
        [ 'std', textbox_computation1, 'fade-in', {blocksPrev: false} ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }


    // focus on computation 2
    {
      const animSequence = new AnimSequence();
      animSequence.setDescription('Focus on computation 2');
      animSequence.setTag('focus comp 2');
      animSequence.addManyBlocks([
        [ 'std', textbox_computation1, 'fade-out', {blocksNext: false} ],
        [ 'line', freeLine_computation1, 'exit-wipe-to-bottom', computationResult1, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
        [ 'std', computationResult1, 'un-highlight', {blocksPrev: false} ],

        [ 'std', computation2, 'highlight', {blocksNext: false} ],
        [ 'line', freeLine_computation2, 'enter-wipe-from-bottom', computation2, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
        [ 'std', textbox_computation2, 'fade-in', {blocksPrev: false} ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }


    // replace subtraction with result; then focus on OPT expression 2
    {
      const animSequence = new AnimSequence();
      animSequence.setDescription('Replace subtraction with result; then focus on OPT expression 2');
      animSequence.addManyBlocks([
        [ 'std', textbox_computation2, 'fade-out', {blocksNext: false} ],
        [ 'line', freeLine_computation2, 'exit-wipe-to-bottom', computation2, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
    
        [ 'std', nextSJNumExpression, 'exit-wipe-to-left' ],
        [ 'std', nextSJNum, 'enter-wipe-from-right' ],
    
        [ 'line', freeLine_OPTExpression2, 'enter-wipe-from-bottom', computation2, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
        [ 'std', textbox_OPTExpression2, 'fade-in', {blocksPrev: false} ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }

    let sourceEl_OPT2, freeLine_fromSourceEl2
    {
      const animSeqPassDown = new AnimSequence();
      animSeqPassDown.addManyBlocks([
        [ 'std', textbox_OPTExpression2, 'fade-out', {blocksNext: false} ],
        [ 'line', freeLine_OPTExpression2, 'exit-wipe-to-bottom', computation2, [0.5, -0.2], null, [0.5, 1] ],
      ]);
      let animSequence;
      // RECURSE 2
      [animSequence, sourceEl_OPT2, freeLine_fromSourceEl2] = jobCardChild2.classList.contains('job-card--stub') ?
        animateJobStub(jobCardChild2, animSeqPassDown, freeLine_downTree, OPTExpression2, jobCardChild1.querySelector('.job-card-bullet')) :
        animateJobCard_R(jobCardChild2, animSeqPassDown, freeLine_downTree, OPTExpression2, jobCardChild1.querySelector('.job-card-bullet'));
      // replace OPT2 expression with answer, hide old text, and add computation 2 text with swapped text
      animSequence.setDescription('Replace OPT2 expression with answer, hide old text, and add computation 2 text with swapped text');
      animSequence.addManyBlocks([
        [ 'line', freeLine_fromSourceEl2, 'enter-wipe-from-bottom', sourceEl_OPT2, [0.5, -0.2], computation2, [0, 1.1] ],

        [ 'std', textP_computation2_intro, 'fade-out', {duration: 0, blocksNext: false} ],
        [ 'std', textP_computation2_summary, 'fade-in', {duration: 0, blocksPrev: false} ],

        [ 'std', computation2, 'un-highlight', {blocksNext: false} ],
        [ 'std', OPTExpression2, 'exit-wipe-to-left', {blocksPrev: false} ],
        [ 'std', computationResult2, 'enter-wipe-from-right', {blocksNext: false} ],
        [ 'std', computationResult2, 'highlight', {blocksPrev: false} ],

        [ 'line', freeLine_computation2, 'enter-wipe-from-bottom', computation2, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
        [ 'std', textbox_computation2, 'fade-in', {blocksPrev: false} ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }
    

    // focus on whole formula container
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Focus on whole formula container');
    animSequence.addManyBlocks([
      [ 'line', freeLine_fromSourceEl2, 'fade-out', sourceEl_OPT2, [0.5, -0.2], computation2, [0, 1] ],
      [ 'std', textbox_computation2, 'fade-out', {blocksNext: false} ],
      [ 'line', freeLine_computation2, 'exit-wipe-to-bottom', computation2, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
      [ 'std', computationResult2, 'un-highlight', {blocksPrev: false} ],

      
      [ 'std', textP_formulaComputation_find, 'fade-out', {duration: 0, blocksNext: false} ],
      [ 'std', textP_formulaComputation_max, 'fade-in', {duration: 0, blocksPrev: false} ],
      [ 'std', formulaContainer, 'highlight', {blocksNext: false} ],
      [ 'line', freeLine_formulaComputation, 'enter-wipe-from-bottom', formulaContainer, [0.5, 0], null, [0.5, 1], {blocksPrev: false} ],
      [ 'std', textbox_formulaComputation, 'fade-in', {blocksPrev: false} ],
    ]);

    animTimeline.addOneSequence(animSequence);
  }


    // replace formula container contents with final answer
    {
      const animSequence = new AnimSequence();
      animSequence.setTag('replace formula container contents');
      animSequence.setDescription('Replace formula container contents with final answer');
      animSequence.addManyBlocks([
        [ 'line', freeLine_formulaComputation, 'updateEndpoints', formulaContainer, [0.5, 0], null, [0.5, 1] ],

        [ 'std', formulaComputation, 'exit-wipe-to-left', {blocksPrev: false} ],
        [ 'std', formulaResult, 'enter-wipe-from-right', {blocksNext: false} ],

        [ 'line', freeLine_formulaComputation, 'updateEndpoints', formulaContainer, [0.5, 0], null, [0.5, 1] ],
    
        [ 'std', textP_formulaComputation_max, 'fade-out', { duration: 250 } ],
        [ 'std', textP_formulaComputation_found, 'fade-in', { duration: 250 } ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }


    // show only M container, replace M access with final computed optimal value, and update M array block
    {
      const animSequence = new AnimSequence();
      animSequence.setDescription('Show only M container, replace M access with final computed optimal value, and update M array block');
      animSequence.setTag('found max');
      animSequence.addManyBlocks([
        // hide formula container
        [ 'std', textbox_formulaComputation, 'fade-out', {blocksNext: false} ],
        [ 'line', freeLine_formulaComputation, 'exit-wipe-to-bottom', formulaContainer, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
        [ 'std', formulaContainer, 'un-highlight', {blocksNext: false} ],
        [ 'std', formulaContainer, 'exit-wipe-to-left' ],
        [ 'std', arrowContainer, 'exit-wipe-to-left' ],
    
        // Visually update M access to final answer
        [ 'std', MAccess, 'exit-wipe-to-left' ],
        [ 'std', MEntry, 'enter-wipe-from-right' ],
        [ 'std', MAccessContainer, 'highlight' ],
    
        // Visually update M array entry
        [ 'line', freeLine_toMBlock, 'enter-wipe-from-right', MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5], {lineOptions: {trackEndpoints: true}} ],
        [ 'std', MBlock_blank, 'fade-out' ],
        [ 'std', MBlock_value, 'fade-in' ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }


    // remove arrow pointing from M block and show final text box
    {
      const animSequence = new AnimSequence();
      animSequence.setDescription('Remove arrow pointing from M block and show final text box');
      animSequence.addManyBlocks([
        // Add last text box
        [ 'std', textP_MAccess_intro, 'fade-out', {duration: 0, blocksNext: false} ],
        [ 'std', textP_MAccess_solved, 'fade-in', {duration: 0, blocksPrev: false} ],
        [ 'line', freeLine_toMBlock, 'exit-wipe-to-right', MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5], {lineOptions: {trackEndpoints: true}} ],
        [ 'line', freeLine_MAccess, 'enter-wipe-from-bottom', MAccessContainer, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false, lineOptions: {trackEndpoints: true}} ],
        [ 'std', textbox_MAccess, 'fade-in', {blocksPrev: false} ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }


    if (parentArrowDown) {
      // just for hiding the last text box before moving back up the tree
      const animSequence = new AnimSequence();
      animSequence.setTag('finish a main card');
      animSequence.addManyBlocks([
        [ 'std', textbox_MAccess, 'fade-out', {blocksNext: false} ],
        [ 'line', freeLine_MAccess, 'exit-wipe-to-bottom', MAccessContainer, [0.1, 0.2], null, [0.5, 1] ],
        [ 'line', parentArrowDown, 'fade-out', parentArrowSource, [0, 1], SJNumLabel, [0.5, -0.2], {blocksNext: false} ],
        [ 'std', MAccessContainer, 'un-highlight', {blocksPrev: false} ],
      ]);

      return [animSequence, MAccessContainer, freeLine_upTree];
    }
  }

  function animateJobStub(jobCard, parentAnimSequence, parentArrowDown, parentArrowSource, aboveBullet) {
    const SJNum = Number.parseInt(jobCard.dataset.sjnum);
    const jobCardContent = jobCard.querySelector('.job-card-content');
    const SJNumLabel = jobCardContent.querySelector('.job-card-SJ-num-label');
    const MAccessContainer = jobCard.querySelector('.M-access-container');
    const MAccess = jobCard.querySelector('.M-access');
    const MEntry = jobCard.querySelector('.M-entry');
    const freeLine_MAccess = jobCard.querySelector('.text-box-line-group--M-access .free-line');
    const textbox_MAccess = jobCard.querySelector('.text-box-line-group--M-access .text-box');
    const textbox_MAccess_p1 = jobCard.querySelector('.text-box-line-group--M-access .text-box .text-box__paragraph--1');
    const textbox_MAccess_p2 = jobCard.querySelector('.text-box-line-group--M-access .text-box .text-box__paragraph--2');
    const freeLine_toMBlock = jobCard.querySelector('.free-line--M-access-to-M-block');


    const MBlock = document.querySelector(`.array--M .array__array-block--${SJNum}`);

    
    const freeLine_bulletConnector = jobCard.querySelector('.free-line--bullet-connector');
    const freeLine_upTree = jobCard.querySelector('.free-line--up-tree');
    const jobCardBullet = jobCard.querySelector('.job-card-bullet');


    // fade in job stub and M access
    {
      const animSequence = parentAnimSequence;
      animSequence.addManyBlocks([
        [ 'std', jobCard, 'fade-in', {blocksNext: false} ],
      ]);
      animSequence.addManyBlocks([
        [ 'line', freeLine_bulletConnector, 'enter-wipe-from-top', aboveBullet, [0.5, 0.5], jobCardBullet, [0.5, 0.5] ],
      ]);
      animSequence.setDescription('Fade in job stub and M access');
      animSequence.addManyBlocks([
        [ 'line', parentArrowDown, 'enter-wipe-from-top', parentArrowSource, [0, 1], SJNumLabel, [0.5, -0.2], {blocksPrev: false} ],
        [ 'std', MAccess, 'fade-in' ],
        [ 'std', MAccessContainer, 'highlight', {blocksNext: false, blocksPrev: false} ],
        [ 'line', freeLine_MAccess, 'enter-wipe-from-bottom', MAccessContainer, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
        [ 'std', textbox_MAccess, 'fade-in', {blocksPrev: false} ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }


    // point to M block array entry
    {
      const animSequence = new AnimSequence();
      animSequence.setDescription('Point to M block array entry');
      animSequence.addOneBlock([ 'line', freeLine_toMBlock, 'enter-wipe-from-right', MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5], {lineOptions: {trackEndpoints: true}} ]);

      animTimeline.addOneSequence(animSequence);
    }
    

    // point back to M access from M block
    {
      const animSequence = new AnimSequence();
      animSequence.setDescription('Point back to M access from M block');
      animSequence.addManyBlocks([
        [ 'line', freeLine_toMBlock, 'fade-out', MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5], {lineOptions: {trackEndpoints: true}} ],
        [ 'line', freeLine_toMBlock, 'enter-wipe-from-left', MBlock, [0.9, 0.5], MAccessContainer, [0, 0.5], {lineOptions: {trackEndpoints: true}} ],
        [ 'std', MAccess, 'exit-wipe-to-left' ],
        [ 'std', MEntry, 'enter-wipe-from-right' ],
        [ 'std', textbox_MAccess_p1, 'fade-out', {duration: 250, blocksNext: false} ],
        [ 'std', textbox_MAccess_p2, 'fade-in', {duration: 250, blocksNext: false} ],
      ]);

      animTimeline.addOneSequence(animSequence);
    }


    // return block that initially hides remaining stuff and points to parent
    {
      const animSequence = new AnimSequence();
      animSequence.addManyBlocks([
        [ 'line', freeLine_toMBlock, 'fade-out', MBlock, [0.9, 0.5], MAccessContainer, [0, 0.5], {blocksNext: false, lineOptions: {trackEndpoints: true}} ],
        [ 'line', freeLine_MAccess, 'exit-wipe-to-bottom', MAccessContainer, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false, blocksNext: false} ],
        [ 'std', textbox_MAccess, 'fade-out', {blocksPrev: false} ],
        [ 'line', parentArrowDown, 'fade-out', parentArrowSource, [0, 1], SJNumLabel, [0.5, -0.2], {blocksNext: false} ],
        [ 'std', MAccessContainer, 'un-highlight', {blocksPrev: false} ],
      ]);
    
      return [animSequence, MAccessContainer, freeLine_upTree];
    }
  }



  // playback buttons
  const forwardButton = document.querySelector('.playback-button--forward');
  const backwardButton = document.querySelector('.playback-button--backward');
  const pauseButton = document.querySelector('.playback-button--pause');
  const fastForwardButton = document.querySelector('.playback-button--fast-forward');
  const skipButton = document.querySelector('.playback-button--enable-skipping');

  // playback button class constants
  const PRESSED = 'playback-button--pressed';
  const PRESSED2 = 'playback-button--pressed--alt-color';
  const DISABLED_FROM_STEPPING = 'playback-button--disabledFromStepping';
  const DISABLED_POINTER_FROM_STEPPING = 'playback-button--disabledPointerFromStepping'; // disables pointer
  const DISABLED_FROM_EDGE = 'playback-button--disabledFromTimelineEdge'; // disables pointer and grays out button
  const DISABLED_FROM_PAUSE = 'playback-button--disabledFromPause';

  // detects if a button was left-clicked (event.which === 1) or a mapped key was pressed (event.which === undefined)
  const isLeftClickOrKey = (event) => event.which === 1 || event.which === undefined;

  let holdingFastKey = false;
  let holdingFastButton = false;


  forwardButton.addEventListener('mousedown', e => {
    if (isLeftClickOrKey(e)) {
      if (animTimeline.getIsStepping() || animTimeline.getIsPaused() || animTimeline.atEnd()) { return; }
      
      forwardButton.classList.add(PRESSED);
      backwardButton.classList.remove(DISABLED_FROM_EDGE); // if stepping forward, we of course won't be at the left edge of timeline
      backwardButton.classList.add(DISABLED_FROM_STEPPING);
      forwardButton.classList.add(DISABLED_POINTER_FROM_STEPPING);

      animTimeline.step('forward')
      .then(() => {
        forwardButton.classList.remove(PRESSED);
        forwardButton.classList.remove(DISABLED_POINTER_FROM_STEPPING);
        backwardButton.classList.remove(DISABLED_FROM_STEPPING);
        if (animTimeline.atEnd()) { forwardButton.classList.add(DISABLED_FROM_EDGE); }
      });
    }
  });

  backwardButton.addEventListener('mousedown', e => {
    if (isLeftClickOrKey(e)) {
      if (animTimeline.getIsStepping() || animTimeline.getIsPaused() || animTimeline.atBeginning()) { return; }

      backwardButton.classList.add(PRESSED);
      forwardButton.classList.remove(DISABLED_FROM_EDGE);
      forwardButton.classList.add(DISABLED_FROM_STEPPING);
      backwardButton.classList.add(DISABLED_POINTER_FROM_STEPPING);

      animTimeline.step('backward')
      .then(() => {
        backwardButton.classList.remove(PRESSED);
        forwardButton.classList.remove(DISABLED_FROM_STEPPING);
        backwardButton.classList.remove(DISABLED_POINTER_FROM_STEPPING);
        if (animTimeline.atBeginning()) { backwardButton.classList.add(DISABLED_FROM_EDGE); }
      });
    }
  });

  pauseButton.addEventListener('mousedown', e => {
    if (isLeftClickOrKey(e)) {
      if (animTimeline.togglePause()) {
        pauseButton.classList.add(PRESSED);
        forwardButton.classList.add(DISABLED_FROM_PAUSE);
        backwardButton.classList.add(DISABLED_FROM_PAUSE);
      }
      else {
        pauseButton.classList.remove(PRESSED);
        forwardButton.classList.remove(DISABLED_FROM_PAUSE);
        backwardButton.classList.remove(DISABLED_FROM_PAUSE);
      }
    }
  });

  skipButton.addEventListener('mousedown', e => {
    if (isLeftClickOrKey(e)) {
      if (animTimeline.toggleSkipping())
        { skipButton.classList.add(PRESSED); }
      else
        { skipButton.classList.remove(PRESSED); }
    }
  });

  fastForwardButton.addEventListener('mousedown', e => {
    if (isLeftClickOrKey(e)) {
      e.which === 1 && (holdingFastButton = true);
      fastForwardButton.classList.add(PRESSED2);
      animTimeline.setPlaybackRate(7);
      document.addEventListener('mouseup', () => {
        holdingFastButton = false;
        if (!(holdingFastButton || holdingFastKey)) {
          fastForwardButton.classList.remove(PRESSED2);
          animTimeline.setPlaybackRate(1);
        }
      }, {once: true});
    }
  })

  // map keys to playback controls
  window.addEventListener('keydown', e => {
    // right arrow key steps forward
    if (e.key === 'ArrowRight') {
      e.preventDefault(); // prevent from moving page right
      forwardButton.dispatchEvent(new Event('mousedown'));
    }

    // left arrow key steps backward
    if (e.key === 'ArrowLeft') {
      e.preventDefault(); // prevent from moving page left
      backwardButton.dispatchEvent(new Event('mousedown'));
    }

    // hold 'f' to increase playback rate (fast-forward)
    if (e.key.toLowerCase() === 'f' && !e.repeat) {
      holdingFastKey = true;
      fastForwardButton.dispatchEvent(new Event('mousedown'));
    }

    // 's' to toggle skipping
    if (e.key.toLowerCase() === 's' && !e.repeat) { skipButton.dispatchEvent(new Event('mousedown')); }

    // ' ' (Space) to pause or unpause
    if (e.key.toLowerCase() === ' ' && !e.repeat) {
      e.preventDefault(); // prevent from moving page down
      pauseButton.dispatchEvent(new Event('mousedown'));
    }
  });

  window.addEventListener('keyup', e => {
    // release 'f' to set playback rate back to 1 (stop fast-forwarding)
    if (e.key === 'f') {
      holdingFastKey = false;
      if (!(holdingFastButton || holdingFastKey))
      {
        fastForwardButton.classList.remove(PRESSED2);
        animTimeline.setPlaybackRate(1);
      }
    }
  });

  // animTimeline.skipTo('skip to');
  // animTimeline.skipTo('focus comp 2');
  // animTimeline.skipTo('found max');
  // animTimeline.skipTo('OPT point 1');
  // animTimeline.skipTo('start');
  // animTimeline.skipTo('finish a main card');
  // animTimeline.skipTo('replace formula container contents');
  // animTimeline.skipTo('explain naive');
  // animTimeline.skipTo('introduce memoization');

  // skips to tag and checks to see if DISABLED_FROM_EDGE should be added or removed from forward/backward buttons
  const skipTo = (tag) => {
    animTimeline.skipTo(tag)
    .then(() => {
      if (animTimeline.atBeginning()) { backwardButton.classList.add(DISABLED_FROM_EDGE); }
      else { backwardButton.classList.remove(DISABLED_FROM_EDGE); }

      if (animTimeline.atEnd()) { forwardButton.classList.add(DISABLED_FROM_EDGE); }
      else { forwardButton.classList.remove(DISABLED_FROM_EDGE); }
    })
  };

  // skipTo('start');

}

// doThing();