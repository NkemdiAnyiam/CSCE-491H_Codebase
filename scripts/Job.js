export class Job {
  static _currJobLetter = 'A';
  static resetCurrJobLetter() { Job._currJobLetter = 'A'; }

  _sortedJobNum = -1;
  _compatibleJobNum = -1;

  constructor(start, finish, weight) {
    this._jobLetter = Job._currJobLetter;
    Job._currJobLetter = String.fromCharCode( Job._currJobLetter.charCodeAt(0) + 1 );
    this._start = start;
    this._finish = finish;
    this._weight = weight;
  }

  getJobLetter() { return this._jobLetter; }
  getStart() { return this._start; }
  getFinish() { return this._finish; }
  getDuration() { return this._finish - this._start; }
  getWeight() { return this._weight; }
  getSortedJobNum() { return this._sortedJobNum; }
  getCompatibleJobNum() { return this._compatibleJobNum; }
  getJobBar() { return this._jobBarEl; }

  setSortedJobNum(sortedJobNum) { this._sortedJobNum = sortedJobNum; }
  setJobBar(jobBarEl) { this._jobBarEl = jobBarEl; }

  findCompatibleJobNum(jobs) {
    this._compatibleJobNum = 0;
    for(let currIdx = this._sortedJobNum - 2; currIdx >= 0; --currIdx) {
      if (jobs[currIdx]._finish <= this._start) {
        this._compatibleJobNum = jobs[currIdx].getSortedJobNum();
        break;
      }
    }
    
    return this._compatibleJobNum;
  }

  toStr() {
    return `jobLetter: ${this._jobLetter}; sortedNum: ${this._sortedJobNum}, start: ${this._start}, finish: ${this._finish}, weight: ${this._weight}`;
  }

  print() {
    console.log(this.toStr());
  }
}
