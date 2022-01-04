export class Job {
  _sortedJobNum = -1;
  _compatibleJobNum = -1;

  constructor(jobLetter, start, finish, weight) {
    this._jobLetter = jobLetter;
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
  // getCompatibleJobNum() { return this._compatibleJobNum; }
  // getJobBar() { return this._jobBarEl; }

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

  generateJobBar() {
    const templateBarId = "time-graph__job-bar-template";
    const resultBarTemplateEl = document.getElementById(templateBarId);
    const cloneBar = document.importNode(resultBarTemplateEl.content, true);

    const jobBarEl = cloneBar.querySelector('.time-graph__job-bar');
    jobBarEl.textContent = `weight ${this._weight}`;
    jobBarEl.dataset.jobletter = this._jobLetter;
    jobBarEl.style.width = `calc(${18 * this.getDuration()}rem + 1px)`;
    return jobBarEl;
  }

  generateJobCard() {

  }

  toStr() {
    return `jobLetter: ${this._jobLetter}; sortedNum: ${this._sortedJobNum}, start: ${this._start}, finish: ${this._finish}, weight: ${this._weight}`;
  }

  print() {
    console.log(this.toStr());
  }
}
