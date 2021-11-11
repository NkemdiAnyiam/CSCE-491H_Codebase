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

export default Job;
