import Job from './Job.js';
import JobScheduler from './JobScheduler.js';
import { AnimObject } from './AnimObject.js';
import { AnimLine } from './AnimLine.js';
import { AnimBlock } from './AnimBlock.js';
import { AnimTimeline } from "./AnimTimeline.js";

// const jobs = [
//   new Job(1, 5, 9, 7),
//   new Job(2, 8, 11, 5),
//   new Job(3, 0, 6, 2),
//   new Job(4, 1, 4, 1),
//   new Job(5, 3, 8, 5),
//   new Job(6, 4, 7, 4),
//   new Job(7, 6, 10, 3),
//   new Job(8, 3, 5, 6),
// ];

// const jobScheduler = new JobScheduler();

// jobs.forEach(job => {
//   jobScheduler.addJob(job);
// });

// jobScheduler.print();
// jobScheduler.sortJobsByFinish();
// jobScheduler.print();
// jobScheduler.setCompatibleJobNums();
// jobScheduler.print();
// jobScheduler.initializeM();
// jobScheduler.print();
// console.log(jobScheduler.computeOPT(jobScheduler.getNumJobs(), document.querySelector('.job-cards')));
// jobScheduler.print();





(function() {
  const jobCard = document.querySelector('.job-card');
  const jobCardContent = jobCard.querySelector('.job-card-content');
  const MAccess = jobCard.querySelector('.M-access');
  const freeLine_MAccess = jobCard.querySelector('.text-box-line-group--M-access .free-line')
  const textbox_MAccess = jobCard.querySelector('.text-box-line-group--M-access .text-box');

  const arrowContainer = jobCard.querySelector('.arrow-container');
  const formulaComputation = jobCard.querySelector('.formula-computation');
  const freeLine_formulaComputation = jobCard.querySelector('.text-box-line-group--formula-computation .free-line');
  const textbox_formulaComputation = jobCard.querySelector('.text-box-line-group--formula-computation .text-box');

  const computationExpression1 = jobCard.querySelector('.computation-expression--1');
  const freeLine_computationExpression1 = jobCard.querySelector('.text-box-line-group--computation-expression--1 .free-line');
  const textbox_computationExpression1 = jobCard.querySelector('.text-box-line-group--computation-expression--1 .text-box');


  const animBlock1 = new AnimBlock(...[
    new AnimObject(jobCardContent, 'fade-in'),
    new AnimObject(MAccess, 'fade-in'),
    new AnimObject(MAccess, 'highlight', {blocksNext: false, blocksPrev: false}),
    new AnimLine(freeLine_MAccess, 'fade-in', MAccess, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false}),
    new AnimObject(textbox_MAccess, 'fade-in', {blocksPrev: false}),
  ]);

  const animBlock2 = new AnimBlock(...[
    new AnimObject(textbox_MAccess, 'fade-out', {blocksNext: false}),
    new AnimLine(freeLine_MAccess, 'fade-out', MAccess, [0.5, -0.2], null, [0.5, 1], {blocksNext: false}),
    new AnimObject(MAccess, 'un-highlight'),
    new AnimObject(arrowContainer, 'enter-wipe-from-right'),
    new AnimObject(formulaComputation, 'fade-in', {blocksPrev: false}),
    new AnimObject(formulaComputation, 'highlight', {blocksNext: false}),
    new AnimLine(freeLine_formulaComputation, 'fade-in', formulaComputation, [0.1, 0.2], null, [0.5, 1], {blocksPrev: false}),
    new AnimObject(textbox_formulaComputation, 'fade-in', {blocksPrev: false}),
  ]);

  const animBlock3 = new AnimBlock(...[
    new AnimObject(textbox_formulaComputation, 'fade-out', {blocksNext: false}),
    new AnimLine(freeLine_formulaComputation, 'fade-out', formulaComputation, [0.1, 0.2], null, [0.5, 1], {blocksNext: false}),
    new AnimObject(formulaComputation, 'un-highlight', {blocksPrev: false}),
    new AnimObject(computationExpression1, 'highlight', {blocksNext: false}),
    new AnimLine(freeLine_computationExpression1, 'fade-in', computationExpression1, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false}),
    new AnimObject(textbox_computationExpression1, 'fade-in', {blocksPrev: false}),
  ]);

  const animBlock4 = new AnimBlock(...[
    new AnimObject(textbox_computationExpression1, 'fade-out', {blocksNext: false}),
    new AnimLine(freeLine_computationExpression1, 'fade-out', computationExpression1, [0.5, -0.2], null, [0.5, 1], {blocksNext: false}),
    new AnimObject(computationExpression1, 'un-highlight', {blocksNext: false, blocksPrev: false}),
  ]);

  const animSequence = new AnimTimeline(...[
    animBlock1,
    animBlock2,
    animBlock3,
    animBlock4,
  ]);



  

  const goForward = async function() {
    return new Promise(async function(resolve) {
      backwardButton.removeEventListener('click', goBackward);
      forwardButton.removeEventListener('click', goForward);
      await animSequence.stepForward();
      backwardButton.addEventListener('click', goBackward);
      forwardButton.addEventListener('click', goForward);

      resolve();
    });
  };

  const goBackward = async function() {
    return new Promise(async function(resolve) {
      backwardButton.removeEventListener('click', goBackward);
      forwardButton.removeEventListener('click', goForward);
      await animSequence.stepBackward();
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
      animSequence.toggleSkipping();
      window.addEventListener('keyup', stopFastForward);
      window.addEventListener('keydown', fastForward);
    }
  };

  const fastForward = function(e) {
    if (e.key.toLowerCase() === 'f') {
      animSequence.fireRateSignal(7);
    }
  };

  const stopFastForward = function(e) {
    if (e.key.toLowerCase() === 'f') {
      animSequence.fireRateSignal(1);
    }
  };

  window.addEventListener('keydown', toggleSkipping);
  window.addEventListener('keydown', fastForward);
  window.addEventListener('keyup', stopFastForward);

  // const card2 = document.querySelector('div[data-card-num="2"]');
  // console.log(card2);
  // card2.style.left = '30rem';
})();
