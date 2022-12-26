export class TreeNode {
  data;
  children = [];
  isLeaf = false;
  isRoot = false;

  addChild(childNode) { this.children.push(childNode); }
}

export class JobScheduler {
  _maxTime = 11;
  // _greatestTime = -1;
  _c = [];
  _M = [];
  _treeRootNode = new TreeNode();
  // static nextCardNum = 1;

  constructor(jobs = []) {
    this._jobs = [...jobs];
    this._n_jobs = jobs.length;
    this._treeRootNode.isRoot = true;
  }

  getRootNode() { return this._treeRootNode; }
  getNumJobs() { return this._n_jobs; }
  getMaxTime() { return this._maxTime; }
  // getGreatestTime() { return this._greatestTime; }
  getJobs() { return [...this._jobs]; }
  getJobsUnsorted() { return [...this._jobsUnsorted]; }
  getC(index) { return this._c[index]; }
  getM(index) { return this._M[index]; }

  addJob(job) { 
    if (job.getFinish() < 0) { throw new Error(`Error: Invalid job finish time "${job.getFinish()}". Finish time must be > 0`); }
    if (job.getFinish() > this._maxTime) { throw new Error(`Error: Invalid job finish time "${job.getFinish()}". Finish time must be < ${this._maxTime}`); }
    this._jobs.push(job);
    this._n_jobs++;
    // this._greatestTime = Math.max(this._greatestTime, job.getFinish());
  }

  addJobs(jobs) {
    jobs.forEach(job => this.addJob(job));
  }

  performWISAlgorithm() {
    this._jobsUnsorted = [...this._jobs];
    this._sortJobsByFinish();
    this._setCompatibleJobNums();
    this._initializeM();

    this._computeOPT(this.getNumJobs(), null);
  }

  jobFinishComparator(job1, job2) {
    if (job1.getFinish() < job2.getFinish()) { return -1; }
    else { return 1; }
  }

  _sortJobsByFinish() {
    this._jobs.sort(this.jobFinishComparator);
    this._jobs.forEach((job, index) => job.setSortedJobNum(index + 1));
  }

  _setCompatibleJobNums() {
    this._c.push(null);
    this._jobs.forEach(job => {
      const compatibleJobNum = job.findCompatibleJobNum(this._jobs);
      this._c.push(compatibleJobNum);
    });
  }

  _initializeM() {
    this._M[0] = 0;
    for (let i = 1; i <= this._n_jobs; ++i) {
      this._M[i] = null;
    }
  }

  _computeOPT(j, parentNode) {
    const treeNode = parentNode ? new TreeNode() : this._treeRootNode;
    parentNode?.addChild(treeNode);

    if (this._M[j] === null) {

      const computationResult1 = this._jobs[j-1].getWeight() + this._computeOPT(this._c[j], treeNode); // assuming this job is part of optimal set
      const computationResult2 = this._computeOPT(j - 1, treeNode); // assuming this job is NOT part of optimal set

      this._M[j] = Math.max(computationResult1, computationResult2); // choosing the best option between the 2 possibilities

      treeNode.data = {
        job: this._jobs[j-1],
        computationResult1: computationResult1,
        computationResult2: computationResult2,
        MEntry: this._M[j],
      };
    }
    else {
      treeNode.isLeaf = true;
      treeNode.data = {
        job: this._jobs[j-1],
        MEntry: this._M[j],
      };
    }

    return this._M[j];
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
