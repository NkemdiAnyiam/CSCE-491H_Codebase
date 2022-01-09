import { Job } from './Job.js';
import { JobScheduler } from './JobScheduler.js';
import { AnimObject } from './AnimObject.js';
import { AnimLine } from './AnimLine.js';
import { AnimBlock } from './AnimBlock.js';
import { AnimTimeline } from "./AnimTimeline.js";

const jobsUnsorted = [
  new Job('A', 5, 9, 7),
  new Job('B', 8, 11, 5),
  // new Job('C', 0, 6, 2),
  // new Job('D', 1, 4, 1),
  // new Job('E', 3, 8, 5),
  // new Job('F', 4, 7, 4),
  // new Job('G', 6, 10, 3),
  // new Job('H', 3, 5, 6),
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
const animBlock0 = new AnimBlock();
jobBarEls.forEach((jobBarEl) => {
  // set up options for moving job bars to correct location
  const jobLetter = jobBarEl.dataset.jobletter;
  const startCell = document.querySelector(`.time-graph__row[data-jobletterunsorted="${jobLetter}"]  .time-graph__cell--${jobBarEl.dataset.start}`);
  const options = { translateOptions: { targetElem: startCell } };
  animBlock0.addAnimObject(new AnimObject(jobBarEl, 'translate', options));
});
animTimeline.addBlock(animBlock0);

// Move job bars back off of the time graph
const animBlock1 = new AnimBlock();
jobBarEls.forEach((jobBarEl, i) => {
  const options = {blocksPrev: false, blocksNext: false, translateOptions: { targetElem: document.querySelector('.time-graph__job-bars') } };
  animBlock1.addAnimObject(new AnimObject(jobBarEl, 'translate', options));
});
animTimeline.addBlock(animBlock1);

// Move job bars back onto the time graph (sorted by finish time) and update time graph row headers
const animBlock2 = new AnimBlock();
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
  
  animBlock2.addManyByParams([
    [ 'object', jobBarEl, 'translate', options ],
    [ 'object', rowUnsortedLetter, 'exit-wipe-to-left', {blocksPrev: false, duration: 250} ],
    [ 'object', rowSJNum, 'enter-wipe-from-right', {blocksNext: false, duration: 250} ],
    [ 'object', rowSortedLetter, 'enter-wipe-from-right', {blocksPrev: false, duration: 250} ],
  ]);
});
animTimeline.addBlock(animBlock2);

// Demonstrate how to fill out the c array
const cBar = document.querySelector('.time-graph__c-bar'); // vertical bar
const timeGraphArrowEl = timeGraphEl.querySelector('.free-line'); // arrow connecting c entry and compatible job's row header
jobBarEls.forEach((jobBarEl, i) => {
  // get j array block corresponding to current job bar
  const jBlock = document.querySelector(`.array-group--j-and-c .array--j .array__array-block--${jobBarEl.dataset.sjnum}`);
  // Move cbar to current job bar, unhide it, and highlight current job bar and j array block
  animTimeline.addOneByParams([
    [ 'object', cBar, 'translate', {duration: 0, translateOptions: { targetElem: jobBarEl, preserveY: true }} ],
    [ 'object', jobBarEl, 'highlight', {blocksNext: false} ],
    [ 'object', jBlock, 'highlight', {blocksNext: false, blocksPrev: false} ],
    [ 'object', cBar, 'fade-in', {blocksPrev: false} ],
  ]);

  // Find job bar corresponding to the job that's compatible with the current job (if it exists)
  const compatibleJobBarEl = document.querySelector(`.time-graph__job-bar[data-sjnum="${jobBarEl.dataset.compatiblejobnum}"]`);
  // get the c array entry corresponding to the current job
  const cBlock = cArray.querySelector(`.array__array-block--${jobBarEl.dataset.sjnum}`);
  const cEntryValue = cBlock.querySelector(`.array__array-entry--value`);
  const cEntryBlank = cBlock.querySelector(`.array__array-entry--blank`)
  let row;
  let rowSJNum;
  const animBlock = new AnimBlock();
  // If the compatible job exists, Move cbar to compatible job bar and highlight it
  // Then point arrow from compatible row header to current c-array entry
  if (compatibleJobBarEl) {
    row = document.querySelector(`.time-graph__row[data-joblettersorted="${compatibleJobBarEl.dataset.jobletter}"]`);
    rowSJNum = row.querySelector('.time-graph__SJ-num');
    animBlock.addManyByParams([
      [ 'object', cBar, 'translate', {translateOptions: { targetElem: compatibleJobBarEl, alignmentX: 'right', preserveY: true }} ],
      [ 'object', compatibleJobBarEl, 'highlight' ],
      [ 'line', timeGraphArrowEl, 'fade-in', rowSJNum, [1, 0.5], cBlock, [0.5, 0], {blocksPrev: false} ],
    ]);
  }
  // If not compatible job exists, move cbar to left of time graph
  // Then point arrow from bottom of cbar to current c-array entry
  else {
    animBlock.addManyByParams([
      [ 'object', cBar, 'translate', {translateOptions: { targetElem: timeGraphEl, alignmentX: 'left', preserveY: true }} ],
      [ 'line', timeGraphArrowEl, 'fade-in', cBar, [0, 1], cBlock, [0.5, 0], {blocksPrev: false} ],
    ]);
  }

  // "Update" current c-array entry
  animBlock.addManyByParams([
    [ 'object', cEntryBlank, 'exit-wipe-to-left', {blocksPrev: false, blocksNext: false} ],
    [ 'object', cEntryValue, 'enter-wipe-from-right', {blocksPrev: false} ],
  ]);

  animTimeline.addBlock(animBlock);

  // Hide cbar and arrow and un-highlight everything
  const animBlock_ = new AnimBlock();
  if (compatibleJobBarEl) {
    animBlock_.addOneByParams([ 'object', compatibleJobBarEl, 'un-highlight', {blocksNext: false} ]);
    animBlock_.addOneByParams([ 'line', timeGraphArrowEl, 'fade-out', rowSJNum, [1, 0.5], cBlock, [0.5, 0], {blocksPrev: false, blocksNext: false} ]);
  }
  else {
    animBlock_.addOneByParams([ 'line', timeGraphArrowEl, 'fade-out', cBar, [0, 1], cBlock, [0.5, 0], {blocksPrev: false, blocksNext: false} ]);
  }
  animBlock_.addManyByParams([
    [ 'object', cBar, 'fade-out', {blocksNext: false, blocksPrev: false} ],
    [ 'object', jobBarEl, 'un-highlight', {blocksPrev: false, blocksNext: false} ],
    [ 'object', jBlock, 'un-highlight', {blocksPrev: false} ],
  ]);
  animTimeline.addBlock(animBlock_);
});



/*
if (main job card)
Fade in main job card
point from M access to M array block
fade arrow
...
Highlight computation

Call recursion; pass in something from self

Un-highlight computation
Replace computation
Highlight next computation

Call recursion; pass in something from self

Un-highlight computation
Replace computation
hide max stuff and show answer
replace M array stuff with answer
point from answer to block in M array
update M array visual
*/

/*
if main card type
  do same stuff
  recurse
  do same stuff
  recurse
if stub
  point from M access to M array block
  replace M array stuff with answer
  point to passed in element to point to
*/




const jobCard = document.querySelector('.job-cards .job-card');
const SJNum = Number.parseInt(jobCard.dataset.sjnum);
const jobCardContent = jobCard.querySelector('.job-card-content');
const MAccessContainer = jobCard.querySelector('.M-access-container');
const MAccess = jobCard.querySelector('.M-access');
const freeLine_MAccess = jobCard.querySelector('.text-box-line-group--M-access .free-line');
const textbox_MAccess = jobCard.querySelector('.text-box-line-group--M-access .text-box');
const freeLine_toMBlock = jobCard.querySelector('.free-line--M-access-to-M-block');


const arrowContainer = jobCard.querySelector('.arrow-container');
const formulaComputation = jobCard.querySelector('.formula-computation');
const freeLine_formulaComputation = jobCard.querySelector('.text-box-line-group--formula-computation .free-line');
const textbox_formulaComputation = jobCard.querySelector('.text-box-line-group--formula-computation .text-box');


const computationExpression1 = jobCard.querySelector('.computation-expression--1');
const freeLine_computationExpression1 = jobCard.querySelector('.text-box-line-group--computation-expression--1 .free-line');
const textbox_computationExpression1 = jobCard.querySelector('.text-box-line-group--computation-expression--1 .text-box');
const cAccessContainer = jobCard.querySelector('.c-access-container');
const cAccess = jobCard.querySelector('.c-access');
const freeLine_toCBlock = jobCard.querySelector('.free-line--c-access-to-c-block');
const OPTExpressionContainer1 = jobCard.querySelector('.computation-expression--1 .OPT-expression-container');
const OPTExpression1 = OPTExpressionContainer1.querySelector('.OPT-expression');


const computation2 = jobCard.querySelector('.computation--2');
const freeLine_computation2 = jobCard.querySelector('.text-box-line-group--computation--2 .free-line');
const textbox_computation2 = jobCard.querySelector('.text-box-line-group--computation--2 .text-box');



const MBlock = document.querySelector(`.array--M .array__array-block--${SJNum}`);
const cBlock = document.querySelector(`.array--c .array__array-block--${SJNum}`);



// fade in job card and M access
const animBlock3 = new AnimBlock(...[
  new AnimObject(jobCardContent, 'fade-in'),
  new AnimObject(MAccess, 'fade-in'),
  new AnimObject(MAccess, 'highlight', {blocksNext: false, blocksPrev: false}),
  new AnimLine(freeLine_MAccess, 'fade-in', MAccess, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false}),
  new AnimObject(textbox_MAccess, 'fade-in', {blocksPrev: false}),
]);

// point to M block array entry
const animBlock4 = new AnimBlock();
animBlock4.addOneByParams([ 'line', freeLine_toMBlock, 'fade-in', MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5] ]);

// focus on arrow container
const animBlock5 = new AnimBlock();
animBlock5.addManyByParams([
  [ 'line', freeLine_toMBlock, 'fade-out', MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5] ],
  [ 'object', textbox_MAccess, 'fade-out', {blocksNext: false} ],
  [ 'line', freeLine_MAccess, 'fade-out', MAccess, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
  [ 'object', MAccess, 'un-highlight' ],

  [ 'object', arrowContainer, 'enter-wipe-from-right' ],
  [ 'object', formulaComputation, 'fade-in', {blocksPrev: false} ],
  [ 'object', formulaComputation, 'highlight', {blocksNext: false} ],
  [ 'line', freeLine_formulaComputation, 'fade-in', formulaComputation, [0.1, 0.2], null, [0.5, 1], {blocksPrev: false} ],
  [ 'object', textbox_formulaComputation, 'fade-in', {blocksPrev: false} ],
]);

// focus on computation 1
const animBlock6 = new AnimBlock();
animBlock6.addManyByParams([
  [ 'object', textbox_formulaComputation, 'fade-out', {blocksNext: false} ],
  [ 'line', freeLine_formulaComputation, 'fade-out', formulaComputation, [0.1, 0.2], null, [0.5, 1], {blocksNext: false} ],
  [ 'object', formulaComputation, 'un-highlight', {blocksPrev: false} ],

  [ 'object', computationExpression1, 'highlight', {blocksNext: false} ],
  [ 'line', freeLine_computationExpression1, 'fade-in', computationExpression1, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
  [ 'object', textbox_computationExpression1, 'fade-in', {blocksPrev: false} ],
]);


// focus on c access and point to c array entry
const animBlock7 = new AnimBlock();
animBlock7.addManyByParams([
  [ 'object', textbox_computationExpression1, 'fade-out', {blocksNext: false} ],
  [ 'line', freeLine_computationExpression1, 'fade-out', computationExpression1, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
  [ 'object', computationExpression1, 'un-highlight', {blocksNext: false, blocksPrev: false} ],

  [ 'object', cAccess, 'highlight', {blocksPrev: false} ],

  [ 'line', freeLine_toCBlock, 'fade-in', cAccessContainer, [0, 0.5], cBlock, [0.9, 0.5], {blocksPrev: false} ],
]);

// focus on first OPT expression as whole
const animBlock8 = new AnimBlock();
animBlock8.addManyByParams([
  [ 'object', cAccess, 'un-highlight', {blocksNext: false, blocksPrev: false} ],
  [ 'line', freeLine_toCBlock, 'fade-out', cAccessContainer, [0, 0.5], cBlock, [0.9, 0.5], {blocksPrev: false} ],

  [ 'object', OPTExpression1, 'highlight', {blocksPrev: false} ],
]);

// RECURSE

// focus on computation 2
const animBlock9 = new AnimBlock();
animBlock9.addManyByParams([
  [ 'object', OPTExpression1, 'un-highlight' ],

  [ 'object', computation2, 'highlight', {blocksNext: false, blocksPrev: false} ],
  [ 'line', freeLine_computation2, 'fade-in', computation2, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false} ],
  [ 'object', textbox_computation2, 'fade-in', {blocksPrev: false} ],
]);

// RECURSE

const animBlock10 = new AnimBlock();
animBlock10.addManyByParams([
  [ 'object', textbox_computation2, 'fade-out', {blocksNext: false} ],
  [ 'line', freeLine_computation2, 'fade-out', computation2, [0.5, -0.2], null, [0.5, 1], {blocksNext: false} ],
  [ 'object', computation2, 'un-highlight', {blocksNext: false, blocksPrev: false} ],
]);


animTimeline.addBlocks([
  animBlock3,
  animBlock4,
  animBlock5,
  animBlock6,
  animBlock7,
  animBlock8,
  animBlock9,
  animBlock10,
]);















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





// (function() {
//   const jobCard = document.querySelector('.job-card');
//   const jobCardContent = jobCard.querySelector('.job-card-content');
//   const MAccess = jobCard.querySelector('.M-access');
//   const freeLine_MAccess = jobCard.querySelector('.text-box-line-group--M-access .free-line')
//   const textbox_MAccess = jobCard.querySelector('.text-box-line-group--M-access .text-box');

//   const arrowContainer = jobCard.querySelector('.arrow-container');
//   const formulaComputation = jobCard.querySelector('.formula-computation');
//   const freeLine_formulaComputation = jobCard.querySelector('.text-box-line-group--formula-computation .free-line');
//   const textbox_formulaComputation = jobCard.querySelector('.text-box-line-group--formula-computation .text-box');

//   const computationExpression1 = jobCard.querySelector('.computation-expression--1');
//   const freeLine_computationExpression1 = jobCard.querySelector('.text-box-line-group--computation-expression--1 .free-line');
//   const textbox_computationExpression1 = jobCard.querySelector('.text-box-line-group--computation-expression--1 .text-box');


//   const animBlock1 = new AnimBlock(...[
//     new AnimObject(jobCardContent, 'fade-in'),
//     new AnimObject(MAccess, 'fade-in'),
//     new AnimObject(MAccess, 'highlight', {blocksNext: false, blocksPrev: false}),
//     new AnimLine(freeLine_MAccess, 'fade-in', MAccess, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false}),
//     new AnimObject(textbox_MAccess, 'fade-in', {blocksPrev: false}),
//   ]);

//   const animBlock2 = new AnimBlock(...[
//     new AnimObject(textbox_MAccess, 'fade-out', {blocksNext: false}),
//     new AnimLine(freeLine_MAccess, 'fade-out', MAccess, [0.5, -0.2], null, [0.5, 1], {blocksNext: false}),
//     new AnimObject(MAccess, 'un-highlight'),
//     new AnimObject(arrowContainer, 'enter-wipe-from-right'),
//     new AnimObject(formulaComputation, 'fade-in', {blocksPrev: false}),
//     new AnimObject(formulaComputation, 'highlight', {blocksNext: false}),
//     new AnimLine(freeLine_formulaComputation, 'fade-in', formulaComputation, [0.1, 0.2], null, [0.5, 1], {blocksPrev: false}),
//     new AnimObject(textbox_formulaComputation, 'fade-in', {blocksPrev: false}),
//   ]);

//   const animBlock3 = new AnimBlock(...[
//     new AnimObject(textbox_formulaComputation, 'fade-out', {blocksNext: false}),
//     new AnimLine(freeLine_formulaComputation, 'fade-out', formulaComputation, [0.1, 0.2], null, [0.5, 1], {blocksNext: false}),
//     new AnimObject(formulaComputation, 'un-highlight', {blocksPrev: false}),
//     new AnimObject(computationExpression1, 'highlight', {blocksNext: false}),
//     new AnimLine(freeLine_computationExpression1, 'fade-in', computationExpression1, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false}),
//     new AnimObject(textbox_computationExpression1, 'fade-in', {blocksPrev: false}),
//     new AnimLine(freeLine_MAccess, 'fade-in', MAccess, [0.5, -0.2], computationExpression1, [0.5, 1], {blocksPrev: false}),
//   ]);

//   const animBlock4 = new AnimBlock(...[
//     new AnimObject(textbox_computationExpression1, 'fade-out', {blocksNext: false}),
//     new AnimLine(freeLine_computationExpression1, 'fade-out', computationExpression1, [0.5, -0.2], null, [0.5, 1], {blocksNext: false}),
//     new AnimObject(computationExpression1, 'un-highlight', {blocksNext: false, blocksPrev: false}),
//   ]);

//   const animSequence = new AnimTimeline(...[
//     animBlock1,
//     animBlock2,
//     animBlock3,
//     animBlock4,
//   ]);



  

//   const goForward = async function() {
//     return new Promise(async function(resolve) {
//       backwardButton.removeEventListener('click', goBackward);
//       forwardButton.removeEventListener('click', goForward);
//       await animSequence.stepForward();
//       backwardButton.addEventListener('click', goBackward);
//       forwardButton.addEventListener('click', goForward);

//       resolve();
//     });
//   };

//   const goBackward = async function() {
//     return new Promise(async function(resolve) {
//       backwardButton.removeEventListener('click', goBackward);
//       forwardButton.removeEventListener('click', goForward);
//       await animSequence.stepBackward();
//       backwardButton.addEventListener('click', goBackward);
//       forwardButton.addEventListener('click', goForward);

//       resolve();
//     });
//   };

  
//   const backwardButton = document.querySelector('.box--backward');
//   const forwardButton = document.querySelector('.box--forward');
//   backwardButton.addEventListener('click', goBackward);
//   forwardButton.addEventListener('click', goForward);

//   const toggleSkipping = function(e) {
//     if (e.key.toLowerCase() === 's' && !e.repeat) {
//       window.removeEventListener('keyup', stopFastForward);
//       window.removeEventListener('keydown', fastForward);
//       animSequence.toggleSkipping();
//       window.addEventListener('keyup', stopFastForward);
//       window.addEventListener('keydown', fastForward);
//     }
//   };

//   const fastForward = function(e) {
//     if (e.key.toLowerCase() === 'f') {
//       animSequence.fireRateSignal(7);
//     }
//   };

//   const stopFastForward = function(e) {
//     if (e.key.toLowerCase() === 'f') {
//       animSequence.fireRateSignal(1);
//     }
//   };

//   window.addEventListener('keydown', toggleSkipping);
//   window.addEventListener('keydown', fastForward);
//   window.addEventListener('keyup', stopFastForward);

//   // const card2 = document.querySelector('div[data-card-num="2"]');
//   // console.log(card2);
//   // card2.style.left = '30rem';
// });
