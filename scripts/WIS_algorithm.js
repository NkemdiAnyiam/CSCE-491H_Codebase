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

  const animBlock1 = new AnimBlock(...[
    new AnimObject(jobCard.querySelector('.job-card-content'), 'fade-in'),
    new AnimObject(jobCard.querySelector('.M-access'), 'fade-in'),
    new AnimObject(jobCard.querySelector('.M-access'), 'highlight'),
    new AnimLine(jobCard.querySelector('.text-box-arrow-group--M-access .arrow'), 'fade-in',
      jobCard.querySelector('.M-access'), [0.5, -0.2], null, [0.5, 1]
    ),
    new AnimObject(jobCard.querySelector('.text-box-arrow-group--M-access .text-box'), 'fade-in', {horizontalOffset: '10rem'}),
  ]);
  const animBlock2 = new AnimBlock(...[
    new AnimObject(jobCard.querySelector('.text-box-arrow-group--M-access .text-box'), 'fade-out'),
    new AnimObject(jobCard.querySelector('.text-box-arrow-group--M-access .arrow'), 'fade-out'),
    new AnimObject(jobCard.querySelector('.M-access'), 'un-highlight'),
    new AnimObject(jobCard.querySelector('.arrow-container'), 'enter-wipe-from-right'),
    new AnimObject(jobCard.querySelector('.formula-computation'), 'fade-in'),
    new AnimObject(jobCard.querySelector('.formula-computation'), 'highlight'),
    new AnimLine(jobCard.querySelector('.text-box-arrow-group--formula-computation .arrow'), 'fade-in',
      jobCard.querySelector('.formula-computation'), [0.1, 0.2], null, [0.5, 1]
    ),
    new AnimObject(jobCard.querySelector('.text-box-arrow-group--formula-computation .text-box'), 'fade-in', {horizontalOffset: '20rem'}),
  ]);
  const animBlock3 = new AnimBlock(...[
    new AnimObject(jobCard.querySelector('.text-box-arrow-group--formula-computation .text-box'), 'fade-out'),
    new AnimObject(jobCard.querySelector('.text-box-arrow-group--formula-computation .arrow'), 'fade-out'),
    new AnimObject(jobCard.querySelector('.formula-computation'), 'un-highlight'),
    new AnimObject(jobCard.querySelector('.computation-expression--1'), 'highlight'),
    new AnimLine(jobCard.querySelector('.text-box-arrow-group--computation-expression--1 .arrow'), 'fade-in',
      jobCard.querySelector('.computation-expression--1'), [0.5, -0.2], null, [0.5, 1]
    ),
    new AnimObject(jobCard.querySelector('.text-box-arrow-group--computation-expression--1 .text-box'), 'fade-in', {horizontalOffset: '25rem'}),
  ]);
  const animBlock4 = new AnimBlock(...[
    new AnimObject(jobCard.querySelector('.text-box-arrow-group--computation-expression--1 .arrow'), 'fade-out'),
    new AnimObject(jobCard.querySelector('.text-box-arrow-group--computation-expression--1 .text-box'), 'fade-out'),
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

  const func2 = function() {
    window.removeEventListener('keyup', func2);
    console.log('UP');
    window.addEventListener('keydown', func);
  }

  const func = function() {
    window.removeEventListener('keydown', func);
    console.log('DOWN');
    window.addEventListener('keyup', func2);
  }

  // window.addEventListener('keydown', func);

  window.addEventListener('keydown', function(e) {
    if (e.key.toLowerCase() === 'f' && !e.repeat) {
      document.styleSheets[1].insertRule('*:not(html):not(body),*::before,*::after { animation-duration: 0.1s!important }');
    }
  });

  window.addEventListener('keyup', function(e) {
    if (e.key.toLowerCase() === 'f') {
      document.styleSheets[1].deleteRule('*:not(html):not(body),*::before,*::after { animation-duration: 0.1s!important }');
    }
  })

  // const card2 = document.querySelector('div[data-card-num="2"]');
  // console.log(card2);
  // card2.style.left = '30rem';
})();
