import Job from './Job.js';
import JobScheduler from './JobScheduler.js';
import AnimObject from './AnimObject.js';
import AnimLine from './AnimLine.js';
import AnimBlock from './AnimBlock.js';
import AnimTimeline from "./AnimTimeline.js";

const jobs = [
  new Job(1, 5, 9, 7),
  new Job(2, 8, 11, 5),
  new Job(3, 0, 6, 2),
  new Job(4, 1, 4, 1),
  new Job(5, 3, 8, 5),
  new Job(6, 4, 7, 4),
  new Job(7, 6, 10, 3),
  new Job(8, 3, 5, 6),
];

const jobScheduler = new JobScheduler();

jobs.forEach(job => {
  jobScheduler.addJob(job);
});

jobScheduler.print();
jobScheduler.sortJobsByFinish();
jobScheduler.print();
jobScheduler.setCompatibleJobNums();
jobScheduler.print();
jobScheduler.initializeM();
jobScheduler.print();
console.log(jobScheduler.computeOPT(jobScheduler.getNumJobs(), document.querySelector('.job-cards')));
jobScheduler.print();





(function() {
  const jobCard = document.querySelector('.job-card');
  const jobCardContent = jobCard.querySelector('.job-card-content');
  const MAccess = jobCard.querySelector('.M-access');
  const arrow_MAccess = jobCard.querySelector('.text-box-arrow-group--M-access .arrow')
  const text_MAccess = jobCard.querySelector('.text-box-arrow-group--M-access .text-box');

  const arrowContainer = jobCard.querySelector('.arrow-container');
  const formulaComputation = jobCard.querySelector('.formula-computation');
  const arrow_formulaComputation = jobCard.querySelector('.text-box-arrow-group--formula-computation .arrow');
  const text_formulaComputation = jobCard.querySelector('.text-box-arrow-group--formula-computation .text-box');

  // const animBlock1 = new AnimBlock(...[
  //   new AnimObject(jobCard.querySelector('.job-card-content'), 'fade-in'),
  //   new AnimObject(jobCard.querySelector('.M-access'), 'fade-in'),
  //   new AnimObject(jobCard.querySelector('.M-access'), 'highlight', {blocksNext: false}),
  //   new AnimLine(jobCard.querySelector('.text-box-arrow-group--M-access .arrow'), 'fade-in',
  //     jobCard.querySelector('.M-access'), [0.5, -0.2], null, [0.5, 1], {blocksPrev: false}
  //   ),
  //   new AnimObject(jobCard.querySelector('.text-box-arrow-group--M-access .text-box'), 'fade-in', {horizontalOffset: '10rem', blocksPrev: false}),
  // ]);
  // const animBlock2 = new AnimBlock(...[
  //   new AnimObject(jobCard.querySelector('.text-box-arrow-group--M-access .text-box'), 'fade-out', {blocksNext: false}),
  //   new AnimObject(jobCard.querySelector('.text-box-arrow-group--M-access .arrow'), 'fade-out', {blocksNext: false}),
  //   new AnimObject(jobCard.querySelector('.M-access'), 'un-highlight'),
  //   new AnimObject(jobCard.querySelector('.arrow-container'), 'enter-wipe-from-right'),
  //   new AnimObject(jobCard.querySelector('.formula-computation'), 'fade-in', {blocksPrev: false}),
  //   new AnimObject(jobCard.querySelector('.formula-computation'), 'highlight', {blocksNext: false}),
  //   new AnimLine(jobCard.querySelector('.text-box-arrow-group--formula-computation .arrow'), 'fade-in',
  //     jobCard.querySelector('.formula-computation'), [0.1, 0.2], null, [0.5, 1], {blocksPrev: false}
  //   ),
  //   new AnimObject(jobCard.querySelector('.text-box-arrow-group--formula-computation .text-box'), 'fade-in', {horizontalOffset: '20rem', blocksPrev: false}),
  // ]);
  // const animBlock3 = new AnimBlock(...[
  //   new AnimObject(jobCard.querySelector('.text-box-arrow-group--formula-computation .text-box'), 'fade-out', {blocksNext: false}),
  //   new AnimObject(jobCard.querySelector('.text-box-arrow-group--formula-computation .arrow'), 'fade-out', {blocksNext: false}),
  //   new AnimObject(jobCard.querySelector('.formula-computation'), 'un-highlight', {blocksPrev: false}),
  //   new AnimObject(jobCard.querySelector('.computation-expression--1'), 'highlight', {blocksNext: false}),
  //   new AnimLine(jobCard.querySelector('.text-box-arrow-group--computation-expression--1 .arrow'), 'fade-in',
  //     jobCard.querySelector('.computation-expression--1'), [0.5, -0.2], null, [0.5, 1], {blocksPrev: false}
  //   ),
  //   new AnimObject(jobCard.querySelector('.text-box-arrow-group--computation-expression--1 .text-box'), 'fade-in', {horizontalOffset: '25rem', blocksPrev: false}),
  // ]);
  // const animBlock4 = new AnimBlock(...[
  //   new AnimObject(jobCard.querySelector('.text-box-arrow-group--computation-expression--1 .text-box'), 'fade-out', {blocksNext: false}),
  //   new AnimObject(jobCard.querySelector('.text-box-arrow-group--computation-expression--1 .arrow'), 'fade-out', {blocksNext: false}),
  //   new AnimObject(jobCard.querySelector('.computation-expression--1'), 'un-highlight', {blocksNext: false, blocksPrev: false}),
  // ]);

  // const animSequence = new AnimTimeline(...[
  //   animBlock1,
  //   animBlock2,
  //   animBlock3,
  //   animBlock4,
  // ]);

  const animBlock1 = new AnimBlock(...[
    new AnimObject(jobCardContent, 'fade-in'),
    new AnimObject(MAccess, 'fade-in'),
    new AnimObject(MAccess, 'highlight', {blocksNext: false, blocksPrev: false}),
    new AnimLine(arrow_MAccess, 'fade-in', MAccess, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false}),
    new AnimObject(text_MAccess, 'fade-in', {horizontalOffset: '10rem', blocksPrev: false}),
  ]);

  const animBlock2 = new AnimBlock(...[
    new AnimObject(text_MAccess, 'fade-out', {blocksNext: false}),
    new AnimObject(arrow_MAccess, 'fade-out', {blocksNext: false}),
    new AnimObject(MAccess, 'un-highlight'),
    new AnimObject(arrowContainer, 'enter-wipe-from-right'),
    new AnimObject(formulaComputation, 'fade-in', {blocksPrev: false}),
    new AnimObject(formulaComputation, 'highlight', {blocksNext: false}),
    new AnimLine(arrow_formulaComputation, 'fade-in', formulaComputation, [0.1, 0.2], null, [0.5, 1], {blocksPrev: false}),
    new AnimObject(text_formulaComputation, 'fade-in', {horizontalOffset: '20rem', blocksPrev: false}),
  ]);

  const animSequence = new AnimTimeline(...[
    animBlock1,
    animBlock2
  ]);


  // const trans = [
  //   {opacity: '1'},
  //   {opacity: '0'}
  // ];

  // const trans = [
  //   {opacity: '-1'}
  // ]

  // const props = {
  //   fill: 'forwards',
  //   duration: 3000,
  // };

  // const trans2 = [
  //   {fontSize: '1rem'}
  // ];

  // const animation = new Animation(
  // );
  // animation.effect = new KeyframeEffect(jobCard, trans, props);
  // // animation.effect.composite = 'accumulate'

  // const animation2 = new Animation(
  //   );
  //   animation2.effect = new KeyframeEffect(jobCard, trans2, props);
  //   animation2.effect.composite = 'accumulate';
  // animation2.play();
  
  // animation.onfinish = () => {
  //   console.log('DONE');
  //   animation.commitStyles();
  //   animation.cancel();
  //   // animation.reverse();
  //   animation.effect.setKeyframes([
  //     {opacity: '1'}
  //   ]);
  //   animation.play();
  // };
  
  
  // animation.play();


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
      if (animSequence.toggleSkipping()) {
        document.getAnimations().forEach(animation => animation.playbackRate = Number.MAX_SAFE_INTEGER);
      }
      window.addEventListener('keyup', stopFastForward);
      window.addEventListener('keydown', fastForward);
    }
  };

  const fastForward = function(e) {
    if (e.key.toLowerCase() === 'f') {
      document.getAnimations().forEach(animation => animation.playbackRate = 10);
    }
  };

  const stopFastForward = function(e) {
    if (e.key.toLowerCase() === 'f') {
      document.getAnimations().forEach(animation => animation.playbackRate = 1);
    }
  };

  window.addEventListener('keydown', toggleSkipping);
  window.addEventListener('keydown', fastForward);
  window.addEventListener('keyup', stopFastForward);

  // const card2 = document.querySelector('div[data-card-num="2"]');
  // console.log(card2);
  // card2.style.left = '30rem';
})();
