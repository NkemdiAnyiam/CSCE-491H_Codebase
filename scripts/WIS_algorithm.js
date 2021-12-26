import Job from './Job.js';
import JobScheduler from './JobScheduler.js';

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
console.log(jobScheduler.computeOPT(jobScheduler.getNumJobs()));
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
  const arrow = document.querySelector('.arrow-container');
  const highlightable = document.querySelector('.highlightable');

  class AnimObject {
    keyFrame = 0;
    exitingList = ['fade-out', 'undo--fade-in', 'exit-wipe-to-right', 'undo--enter-wipe-from-right', 'exit-wipe-to-left', 'undo--enter-wipe-from-left'];
    enteringList = ['fade-in', 'undo--fade-out', 'enter-wipe-from-right', 'undo--exit-wipe-to-right', 'enter-wipe-from-left', 'undo--exit-wipe-to-left'];
    highlightingList = ['highlight', 'undo--un-highlight'];
    unhighlightingList = ['un-highlight', 'undo--highlight'];
    static counterParts = {};
    recentlyAdded = ".";

    constructor(domElem, animSequence) {
      this.domElem = domElem;
      this.animSequence = animSequence;

      this.exitingList.forEach((animName) => {
        AnimObject.counterParts[animName] = this.enteringList;
      });
      this.enteringList.forEach((animName) => {
        AnimObject.counterParts[animName] = this.exitingList;
      });
      this.highlightingList.forEach((animName) => {
        AnimObject.counterParts[animName] = this.unhighlightingList;
      });
      this.unhighlightingList.forEach((animName) => {
        AnimObject.counterParts[animName] = this.highlightingList;
      });
    }

    async stepForward() {
      return new Promise(resolve => {
        const animation = this.animSequence[this.keyFrame];
        (this.exitingList.includes(animation) ? this.animate(animation, true) : this.animate(animation, false))
        .then(() => {
          ++this.keyFrame;
          resolve();
        });
      });
    }

    async stepBackward() {
      return new Promise(resolve => {
        --this.keyFrame;

        const animation = `undo--${this.animSequence[this.keyFrame]}`;
        (this.exitingList.includes(animation) ? this.animate(animation, true) : this.animate(animation, false))
        .then(() => resolve());
      });
    }

    async animate(animClassAdd, isExiting) {
      const removalList = AnimObject.counterParts[animClassAdd];
      return new Promise(resolve => {
        const func = () => {
          this.domElem.removeEventListener('animationend', func);
          if (isExiting) {
            this.domElem.classList.add('hidden');
            this.domElem.classList.remove(...this.unhighlightingList);
          }
          resolve();
        }

        this.domElem.style.animationPlayState = 'paused';
        this.domElem.classList.remove(...removalList);
        this.domElem.classList.add(animClassAdd);
        !isExiting && this.domElem.classList.remove('hidden');
        this.domElem.addEventListener('animationend', func);
        this.domElem.style.animationPlayState = 'running';
      });
    }
  }

  const mContainerObject = new AnimObject(highlightable, ['fade-in', 'highlight', 'un-highlight', 'fade-out']);
  const arrowObject = new AnimObject(arrow, ['enter-wipe-from-right', 'exit-wipe-to-left', 'enter-wipe-from-left', 'exit-wipe-to-right']);

  const goForward = async function() {
    return new Promise(async function(resolve) {
      backwardButton.removeEventListener('click', goBackward);
      forwardButton.removeEventListener('click', goForward);
      await mContainerObject.stepForward();
      await arrowObject.stepForward();
      backwardButton.addEventListener('click', goBackward);
      forwardButton.addEventListener('click', goForward);

      resolve();
    });
  };

  const goBackward = async function() {
    return new Promise(async function(resolve) {
      backwardButton.removeEventListener('click', goBackward);
      forwardButton.removeEventListener('click', goForward);
      await Promise.all([
        mContainerObject.stepBackward(),
        arrowObject.stepBackward(),
      ]);
      backwardButton.addEventListener('click', goBackward);
      forwardButton.addEventListener('click', goForward);

      resolve();
    });
  };

  
  const backwardButton = document.querySelector('.box--backward');
  const forwardButton = document.querySelector('.box--forward');
  backwardButton.addEventListener('click', goBackward);
  forwardButton.addEventListener('click', goForward);

  window.addEventListener('keydown', function() {
    document.styleSheets[1].insertRule('*:not(html),*::before,*::after { animation-duration: 0.1s!important }');
  });
})();
