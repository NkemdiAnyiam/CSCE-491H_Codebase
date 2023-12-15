import { Job } from "./Job";

type TreeNodeData = {
  job: Job;
  computationResult1?: number;
  computationResult2?: number;
  MEntry: number;
};

export class TreeNode {
  data: TreeNodeData = {} as TreeNodeData;
  children: TreeNode[] = [];
  isLeaf = false;
  isRoot = false;

  addChild(childNode: TreeNode) { this.children.push(childNode); }
}

export class JobScheduler {
  maxTime = 11;
  private c: number[] = [];
  private M: number[] = [];
  _treeRootNode = new TreeNode();
  private jobsUnsorted: Job[];
  private jobsSorted: Job[] = [];

  constructor(jobs: Job[] = []) {
    this.jobsUnsorted = [...jobs];
    this._treeRootNode.isRoot = true;
  }

  getRootNode() { return this._treeRootNode; }
  getNumJobs() { return this.jobsSorted.length; }
  getMaxTime() { return this.maxTime; }
  getJobs() { return [...this.jobsSorted]; }
  getJobsUnsorted() { return [...this.jobsUnsorted]; }
  getC(index: number) { return this.c[index]; }
  getM(index: number) { return this.M[index]; }

  public addJob(job: Job): void { 
    if (job.getFinish() < 0) { throw new Error(`Error: Invalid job finish time "${job.getFinish()}". Finish time must be > 0`); }
    if (job.getFinish() > this.maxTime) { throw new Error(`Error: Invalid job finish time "${job.getFinish()}". Finish time must be < ${this.maxTime}`); }
    this.jobsUnsorted.push(job);
  }

  public addJobs(jobs: Job[]): void {
    for (const job of jobs) { this.addJob(job); }
  }

  private sortJobsByFinish(): Job[] {
    const jobFinishComparator = (job1: Job, job2: Job) => job1.getFinish() < job2.getFinish() ? -1 : 1;
    
    const jobsSorted = [...this.jobsUnsorted].sort(jobFinishComparator);
    return jobsSorted;
  }

  private setCompatibleJobNums(): void {
    this.c.push(NaN);
    for (const job of this.jobsSorted) {
      let compatibleJobNum = 0;
      for(let currIdx = job.getSortedJobNum() - 2; currIdx >= 0; --currIdx) {
        const potentialCompJob = this.jobsSorted[currIdx];
        if (potentialCompJob.getFinish() <= job.getStart()) {
          compatibleJobNum = potentialCompJob.getSortedJobNum();
          break;
        }
      }
      job.setCompatibleJobNum(compatibleJobNum);
      this.c.push(compatibleJobNum);
    }
  }

  public performWISAlgorithm(): void {
    this.jobsSorted = this.sortJobsByFinish();
    this.jobsSorted.forEach((job, index) => job.setSortedJobNum(index + 1));
    this.setCompatibleJobNums();
    this.M = [0, ...new Array(this.jobsSorted.length).fill(NaN)];
    this.computeOPT(this.getNumJobs(), null);
  }

  private computeOPT(j: number, parentNode: TreeNode | null): number {
    // if there is no parent node, then we must be at the root
    const treeNode = parentNode ? new TreeNode() : this._treeRootNode;
    parentNode?.addChild(treeNode);

    if (Number.isNaN(this.M[j])) {
      // assuming this job is part of optimal set
      const computationResult1 = this.jobsSorted[j-1].getWeight() + this.computeOPT(this.c[j], treeNode);
       // assuming this job is NOT part of optimal set
      const computationResult2 = this.computeOPT(j - 1, treeNode);

       // choosing the best option between the 2 possibilities
      this.M[j] = Math.max(computationResult1, computationResult2);

      treeNode.data = {
        job: this.jobsSorted[j-1],
        computationResult1: computationResult1,
        computationResult2: computationResult2,
        MEntry: this.M[j],
      };
    }
    else {
      treeNode.isLeaf = true;
      treeNode.data = {
        job: this.jobsSorted[j-1],
        MEntry: this.M[j],
      };
    }

    return this.M[j];
  }

  toStr(): string {
    let thisString = ``;
    thisString += `c array:\n\t${this.c}\n`;
    thisString += `M array:\n\t${this.M}\n`;
    thisString += `Jobs:\n`
    for (const job of this.jobsSorted) {
      thisString += `\t${job.toStr()}\n`;
    }
    return thisString;
  }
  
 print(): void {
    console.log(this.toStr());
  }
}
