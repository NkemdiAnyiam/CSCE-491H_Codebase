class Job {
  _sortedJobNum = -1;

  constructor(jobNum, start, finish, weight) {
    this._jobNum = jobNum;
    this._start = start;
    this._finish = finish;
    this._weight = weight;
  }

  getJobNum() { return this._jobNum; }
  getStart() { return this._start; }
  getFinish() { return this._finish; }
  getWeight() { return this._weight; }
  getSortedJobNum() { return this._sortedJobNum; }

  setSortedJobNum(sortedJobNum) { this._sortedJobNum = sortedJobNum; }
}

const jobFinishComparator = (job1, job2) => {
  if (job1.getFinish() <= job2.getFinish()) { return -1; }
  else { return 1; }
}

const jobs = [
  new Job(1, 5, 9, 7),
  new Job(2, 8, 10, 5),
  new Job(3, 0, 6, 2),
  new Job(4, 1, 4, 1),
  new Job(5, 3, 8, 5),
  new Job(6, 4, 7, 4),
  new Job(7, 6, 10, 3),
  new Job(8, 3, 5, 6),
];


console.log(jobs);
jobs.sort(jobFinishComparator);
jobs.forEach((job, index) => {
  job.setSortedJobNum(index + 1);
});
console.log(jobs);

const computeOpt = jobs => {
  
};

console.log(`Optimal: ${computeOpt(jobs)}`);
jobs.forEach(job => {
  console.log(`Job${job.getJobNum()}: ${job.getSortedJobNum()}`);
});
