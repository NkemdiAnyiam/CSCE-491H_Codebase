class Job {
  _sortedJobNum = -1;
  _compatibleJobNum = -1;

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
  // getCompatibleJobNum() { return this._compatibleJobNum; }

  setSortedJobNum(sortedJobNum) { this._sortedJobNum = sortedJobNum; }
  // setCompatibleJobNum(compatibleJobNum) { this._compatibleJobNum = compatibleJobNum; }

  findCompatibleJobNum(jobs) {
    for(let currIdx = this._sortedJobNum - 2; currIdx >= 0; --currIdx) {
      if (jobs[currIdx]._finish <= this._start) {
        return jobs[currIdx].getSortedJobNum();
      }
    }
    return 0;
  }

  toStr() {
    return `jobNum: ${this._jobNum}; sortedNum: ${this._sortedJobNum}, start: ${this._start}, finish: ${this._finish}, weight: ${this._weight}`;
  }

  print() {
    console.log(this.toStr());
  }
}

class JobScheduler {
  _c = [];
  _M = [];

  constructor(jobs = []) {
    this._jobs = jobs;
    this._n_jobs = jobs.length;
  }

  getNumJobs() { return this._n_jobs; }

  addJob(job) { 
    this._jobs.push(job);
    this._n_jobs++;
  }

  jobFinishComparator(job1, job2) {
    if (job1.getFinish() <= job2.getFinish()) { return -1; }
    else { return 1; }
  }

  sortJobsByFinish() {
    this._jobs.sort(this.jobFinishComparator);
    this._jobs.forEach((job, index) => {
      job.setSortedJobNum(index + 1);
    });
  }

  setCompatibleJobNums() {
    this._c.push(null); // TODO potentially clear before starting
    this._jobs.forEach(job => {
      const compatibleJobNum = job.findCompatibleJobNum(this._jobs);
      // job.setCompatibleJobNum(compatibleJobNum);
      this._c.push(compatibleJobNum);
    });
  }

  initializeM() {
    for (let i = 1; i <= this._n_jobs; ++i) {
      this._M[i] = null;
    }
    this._M[0] = 0;
  }

  computeOPT(j) {
    if (this._M[j] === null) {
      this._M[j] = Math.max(
                            this._jobs[j-1].getWeight() + this.computeOPT(this._c[j]), // assuming this job is part of optimal set
                            this.computeOPT(j - 1) // assuming this job is NOT part of optimal set
      );
    }
    return this._M[j]
  }

  toStr() {
    let thisString = ``;
    thisString += `c array:\n\t${this._c}\n`;
    thisString += `M array:\n\t${this._M}\n`;
    thisString += `Jobs:\n`
    this._jobs.forEach(job => {
      thisString += `\t${job.toStr()}\n`;
    });
    return thisString;
  }
  
 print() {
    console.log(this.toStr());
  }
}

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
