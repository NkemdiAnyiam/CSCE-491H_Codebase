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

const MContainer = document.querySelector('.M-container');
const rect1 = MContainer.getBoundingClientRect();
const box = document.querySelector('.box');
const rect2 = box.getBoundingClientRect();

const line = document.querySelector('.arrow-line');
line.x1.baseVal.value = rect1.left;
line.y1.baseVal.value = rect1.bottom;
line.x2.baseVal.value = rect2.left;
line.y2.baseVal.value = rect2.top;
