export class Job {
  static _currJobLetter = 'A';

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
  // setCompatibleJobNum(compatibleJobNum) { this._compatibleJobNum = compatibleJobNum; }

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

  generateJobBar() {
    const templateBarId = "time-graph__job-bar-template";
    const resultBarTemplateEl = document.getElementById(templateBarId);
    const cloneBar = document.importNode(resultBarTemplateEl.content, true);

    const jobBarEl = cloneBar.querySelector('.time-graph__job-bar');
    jobBarEl.textContent = `weight ${this._weight}`;
    jobBarEl.dataset.jobletter = this._jobLetter;
    jobBarEl.dataset.sjnum = `${this._sortedJobNum}`;
    jobBarEl.dataset.compatiblejobnum = `${this._compatibleJobNum}`;
    jobBarEl.dataset.start = this._start;
    jobBarEl.title = `Job ${this._jobLetter}:
      start = ${this._start}
      finish = ${this._finish}
      weight = ${this._weight}
      j = ${this._sortedJobNum}
      cj = ${this._compatibleJobNum}`;
    jobBarEl.style.width = `calc(${18 * this.getDuration()}rem + 1px)`;
    this._jobBarEl = jobBarEl;
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
