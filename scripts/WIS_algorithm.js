import Job from './Job.js';
import JobScheduler from './JobScheduler.js';
import AnimObject from './AnimObject.js';
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

// const MContainer = document.querySelector('.M-container');
// const rect1 = MContainer.getBoundingClientRect();
// const box = document.querySelector('.box');
// const rect2 = box.getBoundingClientRect();

// const line = document.querySelector('.arrow-line');
// line.x1.baseVal.value = rect1.left;
// line.y1.baseVal.value = rect1.bottom;
// line.x2.baseVal.value = rect2.left;
// line.y2.baseVal.value = rect2.top;
(async function() {
  const jobCard = document.querySelector('.job-card');

  const animBlock1 = new AnimBlock(...[
    new AnimObject(jobCard.querySelector('.job-card-content'), 'fade-in'),
    new AnimObject(jobCard.querySelector('.M-access'), 'fade-in'),
    new AnimObject(jobCard.querySelector('.M-access'), 'highlight'),
  ]);
  const animBlock2 = new AnimBlock(...[
    new AnimObject(jobCard.querySelector('.M-access'), 'un-highlight'),
    new AnimObject(jobCard.querySelector('.arrow-container'), 'enter-wipe-from-right'),
    new AnimObject(jobCard.querySelector('.formula-computation'), 'fade-in'),
    new AnimObject(jobCard.querySelector('.formula-computation'), 'highlight'),
  ]);

  const animSequence = new AnimTimeline(...[
    animBlock1,
    animBlock2,
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

  // window.addEventListener('keydown', function() {
  //   document.styleSheets[1].insertRule('*:not(html),*::before,*::after { animation-duration: 0.1s!important }');
  // });

  // const card2 = document.querySelector('div[data-card-num="2"]');
  // console.log(card2);
  // card2.style.left = '30rem';
})();
