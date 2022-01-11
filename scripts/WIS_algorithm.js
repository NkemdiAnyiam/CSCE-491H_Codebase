import { Job } from './Job.js';
import { JobScheduler } from './JobScheduler.js';
import { AnimBlock } from './AnimBlock.js';
import { AnimBlockLine } from './AnimBlockLine.js';
import { AnimSequence } from './AnimSequence.js';
import { AnimTimeline } from "./AnimTimeline.js";

const jobsUnsorted = [
  // new Job(5, 9, 7),
  new Job(8, 11, 5),
  // new Job(0, 6, 2),
  // new Job(1, 4, 1),
  // new Job(3, 8, 5),
  // new Job(4, 7, 4),
  // new Job(6, 10, 3),
  new Job(3, 5, 6),
];

const jobScheduler = new JobScheduler();

jobsUnsorted.forEach(job => {
  jobScheduler.addJob(job);
});
jobScheduler.sortJobsByFinish();
jobScheduler.setCompatibleJobNums();
jobScheduler.initializeM();

console.log(jobScheduler.computeOPT(jobScheduler.getNumJobs(), document.querySelector('.job-cards')));
jobScheduler.print();
jobScheduler.setUpScene();

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


const animTimeline = new AnimTimeline();

const timeGraphEl = document.querySelector('.time-graph');
const timeGraphRowEls = [...document.querySelectorAll('.time-graph__row')];
const jobBarEls = [...document.querySelectorAll('.time-graph__job-bar')];
const cArray = document.querySelector('.array--c');

// Move job bars onto time graph in unsorted order
const animSequence0 = new AnimSequence();
jobBarEls.forEach((jobBarEl) => {
  // set up options for moving job bars to correct location
  const jobLetter = jobBarEl.dataset.jobletter;
  const startCell = document.querySelector(`.time-graph__row[data-jobletterunsorted="${jobLetter}"]  .time-graph__cell--${jobBarEl.dataset.start}`);
  const options = { translateOptions: { targetElem: startCell } };
  animSequence0.addOneBlock(new AnimBlock(jobBarEl, 'translate', options));
});
animTimeline.addOneSequence(animSequence0);

// Move job bars back off of the time graph
const animSequence1 = new AnimSequence();
jobBarEls.forEach((jobBarEl, i) => {
  const options = {blocksPrev: false, blocksNext: false, translateOptions: { targetElem: document.querySelector('.time-graph__job-bars') } };
  animSequence1.addOneBlock(new AnimBlock(jobBarEl, 'translate', options));
});
animTimeline.addOneSequence(animSequence1);

// Move job bars back onto the time graph (sorted by finish time) and update time graph row headers
const animSequence2 = new AnimSequence();
jobBarEls.forEach((jobBarEl) => {
  // set up options for moving job bars to correct location
  const jobLetter = jobBarEl.dataset.jobletter;
  const row = document.querySelector(`.time-graph__row[data-joblettersorted="${jobLetter}"]`);
  const startCell = row.querySelector(`.time-graph__cell--${jobBarEl.dataset.start}`);
  const options = { blocksNext: false, translateOptions: { targetElem: startCell } };
  
  // get row's header data to animate
  const rowSJNum = row.querySelector('.time-graph__SJ-num');
  const rowUnsortedLetter = row.querySelector('.time-graph__job-letter--unsorted');
  const rowSortedLetter = row.querySelector('.time-graph__job-letter--sorted');
  
  animSequence2.addManyBlocks([
    [ 'std', jobBarEl, 'translate', options ],
    [ 'std', rowUnsortedLetter, 'exit-wipe-to-left', {blocksPrev: false, duration: 250} ],
    [ 'std', rowSJNum, 'enter-wipe-from-right', {blocksNext: false, duration: 250} ],
    [ 'std', rowSortedLetter, 'enter-wipe-from-right', {blocksPrev: false, duration: 250} ],
  ]);
});
animTimeline.addOneSequence(animSequence2);

// Demonstrate how to fill out the c array
const cBar = document.querySelector('.time-graph__c-bar'); // vertical bar
const timeGraphArrowEl = timeGraphEl.querySelector('.free-line'); // arrow connecting c entry and compatible job's row header
jobBarEls.forEach((jobBarEl, i) => {
  // get j array block corresponding to current job bar
  const jBlock = document.querySelector(`.array-group--j-and-c .array--j .array__array-block--${jobBarEl.dataset.sjnum}`);
  // Move cbar to current job bar, unhide it, and highlight current job bar and j array block
  animTimeline.addOneSequence([
    [ 'std', cBar, 'translate', {duration: 0, translateOptions: { targetElem: jobBarEl, preserveY: true }} ],
    [ 'std', jobBarEl, 'highlight', {blocksNext: false} ],
    [ 'std', jBlock, 'highlight', {blocksNext: false, blocksPrev: false} ],
    [ 'std', cBar, 'fade-in', {blocksPrev: false} ],
  ]);

  // Find job bar corresponding to the job that's compatible with the current job (if it exists)
  const compatibleJobBarEl = document.querySelector(`.time-graph__job-bar[data-sjnum="${jobBarEl.dataset.compatiblejobnum}"]`);
  // get the c array entry corresponding to the current job
  const cBlock = cArray.querySelector(`.array__array-block--${jobBarEl.dataset.sjnum}`);
  const cEntryValue = cBlock.querySelector(`.array__array-entry--value`);
  const cEntryBlank = cBlock.querySelector(`.array__array-entry--blank`);
  let row;
  let rowSJNum;
  const animSequence = new AnimSequence();
  // If the compatible job exists, Move cbar to compatible job bar and highlight it
  // Then point arrow from compatible row header to current c-array entry
  if (compatibleJobBarEl) {
    row = document.querySelector(`.time-graph__row[data-joblettersorted="${compatibleJobBarEl.dataset.jobletter}"]`);
    rowSJNum = row.querySelector('.time-graph__SJ-num');
    animSequence.addManyBlocks([
      [ 'std', cBar, 'translate', {translateOptions: { targetElem: compatibleJobBarEl, alignmentX: 'right', preserveY: true }} ],
      [ 'std', compatibleJobBarEl, 'highlight' ],
      [ 'line', timeGraphArrowEl, 'fade-in', rowSJNum, [1, 0.5], cBlock, [0.5, 0], {blocksPrev: false} ],
    ]);
  }
  // If not compatible job exists, move cbar to left of time graph
  // Then point arrow from bottom of cbar to current c-array entry
  else {
    animSequence.addManyBlocks([
      [ 'std', cBar, 'translate', {translateOptions: { targetElem: timeGraphEl, alignmentX: 'left', preserveY: true }} ],
      [ 'line', timeGraphArrowEl, 'fade-in', cBar, [0, 1], cBlock, [0.5, 0], {blocksPrev: false} ],
    ]);
  }

  // "Update" current c-array entry
  animSequence.addManyBlocks([
    [ 'std', cEntryBlank, 'exit-wipe-to-left', {blocksPrev: false, blocksNext: false} ],
    [ 'std', cEntryValue, 'enter-wipe-from-right', {blocksPrev: false} ],
  ]);

  animTimeline.addOneSequence(animSequence);

  // Hide cbar and arrow and un-highlight everything
  const animSequence_ = new AnimSequence();
  if (compatibleJobBarEl) {
    animSequence_.addOneBlock([ 'std', compatibleJobBarEl, 'un-highlight', {blocksNext: false} ]);
    animSequence_.addOneBlock([ 'line', timeGraphArrowEl, 'fade-out', rowSJNum, [1, 0.5], cBlock, [0.5, 0], {blocksPrev: false, blocksNext: false} ]);
  }
  else {
    animSequence_.addOneBlock([ 'line', timeGraphArrowEl, 'fade-out', cBar, [0, 1], cBlock, [0.5, 0], {blocksPrev: false, blocksNext: false} ]);
  }
  animSequence_.addManyBlocks([
    [ 'std', cBar, 'fade-out', {blocksNext: false, blocksPrev: false} ],
    [ 'std', jobBarEl, 'un-highlight', {blocksPrev: false, blocksNext: false} ],
    [ 'std', jBlock, 'un-highlight', {blocksPrev: false} ],
  ]);
  animTimeline.addOneSequence(animSequence_);
});





animateJobCard_R(document.querySelector('.job-card'), null);

function animateJobCard_R(jobCard, parentJobCard) {
  const SJNum = Number.parseInt(jobCard.dataset.sjnum);
  const jobCardContent = jobCard.querySelector('.job-card-content');
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
  const freeLine_computation1 = jobCard.querySelector('.text-box-line-group--computation--1 .free-line');
  const textbox_computation1 = jobCard.querySelector('.text-box-line-group--computation--1 .text-box');
  const computationExpression1 = jobCard.querySelector('.computation--1 .computation-expression');
  const computationResult1 = jobCard.querySelector('.computation--1 .computation-result');
  const textP_computation1_intro = textbox_computation1.querySelector('.text-box__paragraph--intro');
  const textP_computation1_summary = textbox_computation1.querySelector('.text-box__paragraph--summary');
  const cAccessContainer = jobCard.querySelector('.c-access-container');
  const cAccess = jobCard.querySelector('.c-access');
  const cEntry = jobCard.querySelector('.c-entry');
  const freeLine_cAccess = jobCard.querySelector('.text-box-line-group--c-access .free-line');
  const textbox_cAccess = jobCard.querySelector('.text-box-line-group--c-access .text-box');
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


  // fade in job card and M access
  const animSequence3 = new AnimSequence([
    [ 'std', jobCardContent, 'fade-in' ],
    [ 'std', MAccess, 'fade-in' ],
    [ 'std', MAccessContainer, 'highlight', {blocksNext: false, blocksPrev: false} ],
    [ 'line', freeLine_MAccess, 'fade-in', MAccess, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
    [ 'std', textbox_MAccess, 'fade-in', {blocksPrev: false} ],
  ]);

  // point to M block array entry
  const animSequence4 = new AnimSequence();
  animSequence4.addOneBlock([ 'line', freeLine_toMBlock, 'fade-in', MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5] ]);

  // focus on formula container
  const animSequence5 = new AnimSequence();
  animSequence5.addManyBlocks([
    [ 'line', freeLine_toMBlock, 'fade-out', MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5] ],
    [ 'std', textbox_MAccess, 'fade-out', {blocksNext: false} ],
    [ 'line', freeLine_MAccess, 'fade-out', MAccess, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
    [ 'std', MAccessContainer, 'un-highlight' ],

    [ 'std', arrowContainer, 'enter-wipe-from-right' ],
    [ 'std', formulaComputation, 'fade-in', {blocksPrev: false} ],
    [ 'std', formulaComputation, 'highlight', {blocksNext: false} ],
    [ 'line', freeLine_formulaComputation, 'fade-in', formulaComputation, [0.1, 0.2], null, [0.5, 1], {blocksPrev: false} ],
    [ 'std', textbox_formulaComputation, 'fade-in', {blocksPrev: false} ],
  ]);

  // focus on computation 1
  const animSequence6 = new AnimSequence();
  animSequence6.addManyBlocks([
    [ 'std', textbox_formulaComputation, 'fade-out', {blocksNext: false} ],
    [ 'line', freeLine_formulaComputation, 'fade-out', formulaComputation, [0.1, 0.2], null, [0.5, 1], {blocksNext: false} ],
    [ 'std', formulaComputation, 'un-highlight', {blocksPrev: false} ],

    [ 'std', computationExpression1, 'highlight', {blocksNext: false} ],
    [ 'line', freeLine_computation1, 'fade-in', computation1, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
    [ 'std', textbox_computation1, 'fade-in', {blocksPrev: false} ],
  ]);


  // focus on c access and point to c array entry
  const animSequence7 = new AnimSequence();
  animSequence7.addManyBlocks([
    [ 'std', textbox_computation1, 'fade-out', {blocksNext: false} ],
    [ 'line', freeLine_computation1, 'fade-out', computation1, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
    [ 'std', computationExpression1, 'un-highlight', {blocksNext: false, blocksPrev: false} ],

    [ 'std', cAccessContainer, 'highlight', {blocksPrev: false} ],
    [ 'line', freeLine_cAccess, 'fade-in', cAccessContainer, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
    [ 'std', textbox_cAccess, 'fade-in', {blocksPrev: false} ],

    [ 'line', freeLine_toCBlock, 'fade-in', cAccessContainer, [0, 0.5], cBlock, [0.9, 0.5], {blocksPrev: false} ],
  ]);

  // point from c array entry back to job card and replace c access. Then focus on OPT exprssion 1 as a whole
  const animSequence8 = new AnimSequence();
  animSequence8.addManyBlocks([
    // replace c entry
    [ 'line', freeLine_toCBlock, 'fade-out', cAccessContainer, [0, 0.5], cBlock, [0.9, 0.5] ],
    [ 'line', freeLine_toCBlock, 'fade-in', cBlock, [0.9, 0.5], cAccessContainer, [0, 0.5] ],
    [ 'std', cAccess, 'exit-wipe-to-left' ],
    [ 'std', cEntry, 'enter-wipe-from-right' ],
    [ 'line', freeLine_toCBlock, 'fade-out', cBlock, [0.9, 0.5], cAccessContainer, [0, 0.5] ],

    // remove c access text
    [ 'std', textbox_cAccess, 'fade-out', {blocksNext: false} ],
    [ 'line', freeLine_cAccess, 'fade-out', cAccessContainer, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
    [ 'std', cAccessContainer, 'un-highlight', {blocksPrev: false} ],

    // enter OPT expression 1 text
    [ 'std', OPTExpressionContainer1, 'highlight', {blocksPrev: false} ],
    [ 'line', freeLine_OPTExpression1, 'fade-in', OPTExpressionContainer1, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
    [ 'std', textbox_OPTExpression1, 'fade-in', {blocksPrev: false} ],
  ]);

  animTimeline.addManySequences([
    animSequence3,
    animSequence4,
    animSequence5,
    animSequence6,
    animSequence7,
    animSequence8,
  ]);

  // RECURSE 1
  const [animSequence9, sourceEl_OPT1, freeLine_fromSourceEl1] = jobCardChild1.classList.contains('job-card--stub') ?
    animateJobStub(jobCardChild1, jobCard) :
    animateJobCard_R(jobCardChild1, jobCard);
  // replace OPT1 expression with answer, change text box text
  animSequence9.addManyBlocks([
    [ 'line', freeLine_fromSourceEl1, 'fade-in', sourceEl_OPT1, [0.5, -0.2], OPTExpressionContainer1, [0, 1] ],
    [ 'std', OPTExpression1, 'exit-wipe-to-left' ],
    [ 'std', OPTResult1, 'enter-wipe-from-right' ],
    [ 'std', textP_OPTExpression1_find, 'fade-out', { duration: 250 } ],
    [ 'std', textP_OPTExpression1_found, 'fade-in', { duration: 250 } ],
  ]);

  // remove arrow coming from child, hide current text; replace computation expression with answer; and focus on whole computation1 (swap text as well)
  const animSequence10 = new AnimSequence();
  animSequence10.addManyBlocks([
    [ 'line', freeLine_fromSourceEl1, 'fade-out', sourceEl_OPT1, [0.5, -0.2], OPTExpressionContainer1, [0, 1], {blocksNext: false} ],
    [ 'std', textbox_OPTExpression1, 'fade-out', {blocksPrev: false, blocksNext: false} ],
    [ 'line', freeLine_OPTExpression1, 'fade-out', OPTExpressionContainer1, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
    [ 'std', OPTExpressionContainer1, 'un-highlight', {blocksPrev: false} ],

    [ 'std', textP_computation1_intro, 'fade-out', {duration: 0, blocksNext: false} ],
    [ 'std', textP_computation1_summary, 'fade-in', {duration: 0, blocksPrev: false} ],
    [ 'std', computation1, 'highlight', {blocksPrev: false} ],
    [ 'std', computationExpression1, 'exit-wipe-to-left', ],
    [ 'std', computationResult1, 'enter-wipe-from-right', ],
    [ 'line', freeLine_computation1, 'fade-in', computation1, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
    [ 'std', textbox_computation1, 'fade-in', {blocksPrev: false} ],
  ]);

  // focus on computation 2
  const animSequence11 = new AnimSequence();
  animSequence11.addManyBlocks([
    [ 'std', textbox_computation1, 'fade-out', {blocksNext: false} ],
    [ 'line', freeLine_computation1, 'fade-out', computation1, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
    [ 'std', computation1, 'un-highlight', {blocksNext: false, blocksPrev: false} ],

    [ 'std', computation2, 'highlight', {blocksNext: false} ],
    [ 'line', freeLine_computation2, 'fade-in', computation2, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
    [ 'std', textbox_computation2, 'fade-in', {blocksPrev: false} ],
  ]);

  // replace subtraction with result; then focus on OPT expression 2
  const animSequence12 = new AnimSequence();
  animSequence12.addManyBlocks([
    [ 'std', textbox_computation2, 'fade-out', {blocksNext: false} ],
    [ 'line', freeLine_computation2, 'fade-out', computation2, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],

    [ 'std', nextSJNumExpression, 'exit-wipe-to-left' ],
    [ 'std', nextSJNum, 'enter-wipe-from-right' ],

    [ 'line', freeLine_OPTExpression2, 'fade-in', computation2, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
    [ 'std', textbox_OPTExpression2, 'fade-in', {blocksPrev: false} ],
  ]);


  animTimeline.addManySequences([
    animSequence9,
    animSequence10,
    animSequence11,
    animSequence12,
  ]);

  // RECURSE 2
  const [animSequence13, sourceEl_OPT2, freeLine_fromSourceEl2] = jobCardChild2.classList.contains('job-card--stub') ?
    animateJobStub(jobCardChild2, jobCard) :
    animateJobCard_R(jobCardChild2, jobCard);
  // replace OPT2 expression with answer, hide old text, and add computation 2 text with swapped text
  animSequence13.addManyBlocks([
    [ 'line', freeLine_fromSourceEl2, 'fade-in', sourceEl_OPT2, [0.5, -0.2], computation2, [0, 1] ],

    [ 'std', textbox_OPTExpression2, 'fade-out', {blocksNext: false} ],
    [ 'line', freeLine_OPTExpression2, 'fade-out', computation2, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],

    [ 'std', textP_computation2_intro, 'fade-out', {duration: 0, blocksNext: false} ],
    [ 'std', textP_computation2_summary, 'fade-in', {duration: 0, blocksPrev: false} ],

    [ 'std', OPTExpression2, 'exit-wipe-to-left' ],
    [ 'std', computationResult2, 'enter-wipe-from-right' ],

    [ 'line', freeLine_computation2, 'fade-in', computation2, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
    [ 'std', textbox_computation2, 'fade-in', {blocksPrev: false} ],
  ]);

  // focus on whole formula container
  const animSequence14 = new AnimSequence();
  animSequence14.addManyBlocks([
    [ 'line', freeLine_fromSourceEl2, 'fade-out', sourceEl_OPT2, [0.5, -0.2], computation2, [0, 1], {blocksNext: false} ],
    [ 'std', textbox_computation2, 'fade-out', {blocksNext: false} ],
    [ 'line', freeLine_computation2, 'fade-out', computation2, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
    [ 'std', computation2, 'un-highlight', {blocksNext: false, blocksPrev: false} ],

    
    [ 'std', textP_formulaComputation_find, 'fade-out', {duration: 0, blocksNext: false} ],
    [ 'std', textP_formulaComputation_max, 'fade-in', {duration: 0, blocksPrev: false} ],
    [ 'std', formulaContainer, 'highlight', {blocksNext: false} ],
    [ 'line', freeLine_formulaComputation, 'fade-in', formulaContainer, [0.1, 0.2], null, [0.5, 1], {blocksPrev: false} ],
    [ 'std', textbox_formulaComputation, 'fade-in', {blocksPrev: false} ],
  ]);

  // replace formula container contents with final answer
  const animSequence15 = new AnimSequence();
  animSequence15.addManyBlocks([
    [ 'std', formulaComputation, 'exit-wipe-to-left' ],
    [ 'std', formulaResult, 'enter-wipe-from-right' ],

    [ 'std', textP_formulaComputation_max, 'fade-out', { duration: 250 } ],
    [ 'std', textP_formulaComputation_found, 'fade-in', { duration: 250 } ],
  ]);

  // show only M container, replace M access with final computed optimal value, and update M array block
  const animSequence16 = new AnimSequence();
  animSequence16.addManyBlocks([
    // hide formula container
    [ 'std', textbox_formulaComputation, 'fade-out', {blocksNext: false} ],
    [ 'line', freeLine_formulaComputation, 'fade-out', formulaContainer, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
    [ 'std', formulaContainer, 'exit-wipe-to-left' ],
    [ 'std', arrowContainer, 'exit-wipe-to-left', {blocksNext: false} ],

    // Visually update M access to final answer
    [ 'std', MAccessContainer, 'highlight', {blocksPrev: false} ],
    [ 'std', MAccess, 'exit-wipe-to-left', {blocksPrev: false, blocksNext: false} ],
    [ 'std', MEntry, 'enter-wipe-from-right', {blocksPrev: false} ],

    // Visually update M array entry
    [ 'line', freeLine_toMBlock, 'fade-in', MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5] ],
    [ 'std', MBlock_blank, 'fade-out' ],
    [ 'std', MBlock_value, 'fade-in' ],
  ]);

  // show only M container and replace M access with final computed optimal value
  const animSequence17 = new AnimSequence();
  animSequence17.addManyBlocks([
    // Add last text box
    [ 'std', textP_MAccess_intro, 'fade-out', {duration: 0, blocksNext: false} ],
    [ 'std', textP_MAccess_solved, 'fade-in', {duration: 0, blocksPrev: false} ],
    [ 'line', freeLine_toMBlock, 'fade-out', MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5] ],
    [ 'line', freeLine_MAccess, 'fade-in', MAccessContainer, [0.1, 0.2], null, [0.5, 1], {blocksPrev: false} ],
    [ 'std', textbox_MAccess, 'fade-in', {blocksPrev: false} ],
  ]);

  animTimeline.addManySequences([
    animSequence13,
    animSequence14,
    animSequence15,
    animSequence16,
    animSequence17,
  ]);

  if (parentJobCard) {
    // just for hiding the last text box before moving back up the tree
    const animSequence18 = new AnimSequence();
    animSequence18.addManyBlocks([
      [ 'std', textbox_MAccess, 'fade-out', {blocksNext: false} ],
      [ 'line', freeLine_MAccess, 'fade-out', MAccessContainer, [0.1, 0.2], null, [0.5, 1] ],
    ]);

    return [animSequence18, MAccessContainer, freeLine_upTree];
  }
}

function animateJobStub(jobCard, parentJobCard) {
  const SJNum = Number.parseInt(jobCard.dataset.sjnum);
  const jobCardContent = jobCard.querySelector('.job-card-content');
  const MAccessContainer = jobCard.querySelector('.M-access-container');
  const MAccess = jobCard.querySelector('.M-access');
  const MEntry = jobCard.querySelector('.M-entry');
  const freeLine_MAccess = jobCard.querySelector('.text-box-line-group--M-access .free-line');
  const textbox_MAccess = jobCard.querySelector('.text-box-line-group--M-access .text-box');
  const textbox_MAccess_p1 = jobCard.querySelector('.text-box-line-group--M-access .text-box .text-box__paragraph--1');
  const textbox_MAccess_p2 = jobCard.querySelector('.text-box-line-group--M-access .text-box .text-box__paragraph--2');
  const freeLine_toMBlock = jobCard.querySelector('.free-line--M-access-to-M-block');


  const MBlock = document.querySelector(`.array--M .array__array-block--${SJNum}`);

  const freeLine_upTree = jobCard.querySelector('.free-line--up-tree');


  const animSequence3 = new AnimSequence();
  animSequence3.addManyBlocks([
    [ 'std', jobCardContent, 'fade-in' ],
    [ 'std', MAccess, 'fade-in' ],
    [ 'std', MAccessContainer, 'highlight', {blocksNext: false, blocksPrev: false} ],
    [ 'line', freeLine_MAccess, 'fade-in', MAccessContainer, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
    [ 'std', textbox_MAccess, 'fade-in', {blocksPrev: false} ],
  ]);

  // point to M block array entry
  const animSequence4 = new AnimSequence();
  animSequence4.addOneBlock([ 'line', freeLine_toMBlock, 'fade-in', MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5] ]);

  // point back to M access from M block
  const animSequence5 = new AnimSequence();
  animSequence5.addManyBlocks([
    [ 'line', freeLine_toMBlock, 'fade-out', MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5] ],
    [ 'line', freeLine_toMBlock, 'fade-in', MBlock, [0.9, 0.5], MAccessContainer, [0, 0.5] ],
    [ 'std', MAccess, 'exit-wipe-to-left' ],
    [ 'std', MEntry, 'enter-wipe-from-right' ],
    [ 'std', textbox_MAccess_p1, 'fade-out', {duration: 250, blocksNext: false} ],
    [ 'std', textbox_MAccess_p2, 'fade-in', {duration: 250, blocksNext: false} ],
  ]);

  animTimeline.addManySequences([
    animSequence3,
    animSequence4,
    animSequence5,
  ]);

  const animSequence6 = new AnimSequence();
  animSequence6.addManyBlocks([
    [ 'line', freeLine_toMBlock, 'fade-out', MBlock, [0.9, 0.5], MAccessContainer, [0, 0.5], {blocksNext: false} ],
    [ 'line', freeLine_MAccess, 'fade-out', MAccessContainer, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false, blocksNext: false} ],
    [ 'std', textbox_MAccess, 'fade-out', {blocksPrev: false} ],
  ]);

  return [animSequence6, MAccessContainer, freeLine_upTree];
}







const goForward = async function() {
  return new Promise(async function(resolve) {
    backwardButton.removeEventListener('click', goBackward);
    forwardButton.removeEventListener('click', goForward);
    await animTimeline.stepForward();
    backwardButton.addEventListener('click', goBackward);
    forwardButton.addEventListener('click', goForward);

    resolve();
  });
};

const goBackward = async function() {
  return new Promise(async function(resolve) {
    backwardButton.removeEventListener('click', goBackward);
    forwardButton.removeEventListener('click', goForward);
    await animTimeline.stepBackward();
    backwardButton.addEventListener('click', goBackward);
    forwardButton.addEventListener('click', goForward);

    resolve();
  });
};


const backwardButton = document.querySelector('.box--backward');
const forwardButton = document.querySelector('.box--forward');
backwardButton.addEventListener('click', goBackward);
forwardButton.addEventListener('click', goForward);

const toggleSkipping = function(e) {
  if (e.key.toLowerCase() === 's' && !e.repeat) {
    window.removeEventListener('keyup', stopFastForward);
    window.removeEventListener('keydown', fastForward);
    animTimeline.toggleSkipping();
    window.addEventListener('keyup', stopFastForward);
    window.addEventListener('keydown', fastForward);
  }
};

const fastForward = function(e) {
  if (e.key.toLowerCase() === 'f') {
    animTimeline.fireRateSignal(7);
  }
};

const stopFastForward = function(e) {
  if (e.key.toLowerCase() === 'f') {
    animTimeline.fireRateSignal(1);
  }
};

window.addEventListener('keydown', toggleSkipping);
window.addEventListener('keydown', fastForward);
window.addEventListener('keyup', stopFastForward);

