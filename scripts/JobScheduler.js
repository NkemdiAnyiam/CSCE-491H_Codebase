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
    this._M[0] = 0;
    for (let i = 1; i <= this._n_jobs; ++i) {
      this._M[i] = null;
    }
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

export default JobScheduler;
